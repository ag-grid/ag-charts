import type { _ModuleSupport } from 'ag-charts-community';

import { extendBbox } from './bboxUtil';
import { lineStringCenter, lineStringLength } from './lineStringUtil';
import { polygonBbox, preferredLabelCenter } from './polygonUtil';

export function geometryBbox(
    geometry: _ModuleSupport.Geometry,
    into: _ModuleSupport.LonLatBBox | undefined
): _ModuleSupport.LonLatBBox | undefined {
    if (geometry.bbox != null) {
        const [lon0, lat0, lon1, lat1] = geometry.bbox;
        into = extendBbox(into, lon0, lat0, lon1, lat1);
        return into;
    }

    switch (geometry.type) {
        case 'GeometryCollection':
            geometry.geometries.forEach((g) => {
                into = geometryBbox(g, into);
            });
            break;
        case 'MultiPolygon':
            geometry.coordinates.forEach((c) => {
                if (c.length > 0) {
                    into = polygonBbox(c[0], into);
                }
            });
            break;
        case 'Polygon':
            if (geometry.coordinates.length > 0) {
                into = polygonBbox(geometry.coordinates[0], into);
            }
            break;
        case 'MultiLineString':
            geometry.coordinates.forEach((c) => {
                into = polygonBbox(c, into);
            });
            break;
        case 'LineString':
            into = polygonBbox(geometry.coordinates, into);
            break;
        case 'MultiPoint':
            geometry.coordinates.forEach((p) => {
                const [lon, lat] = p;
                into = extendBbox(into, lon, lat, lon, lat);
            });
            break;
        case 'Point': {
            const [lon, lat] = geometry.coordinates;
            into = extendBbox(into, lon, lat, lon, lat);
            break;
        }
    }

    return into;
}

function pointsCenter(points: _ModuleSupport.Position[]): _ModuleSupport.Position | undefined {
    if (points.length === 0) return;

    let totalX = 0;
    let totalY = 0;
    for (const [x, y] of points) {
        totalX += x;
        totalY += y;
    }

    return [totalX / points.length, totalY / points.length];
}

export enum GeometryType {
    Any = 0b111,
    Polygon = 0b001,
    LineString = 0b010,
    Point = 0b100,
}

export function containsType(geometry: _ModuleSupport.Geometry | null, type: GeometryType): boolean {
    if (geometry == null) return false;

    switch (geometry.type) {
        case 'GeometryCollection':
            return geometry.geometries.some((g) => containsType(g, type));
        case 'MultiPolygon':
        case 'Polygon':
            return (type & GeometryType.Polygon) !== 0;
        case 'MultiLineString':
        case 'LineString':
            return (type & GeometryType.LineString) !== 0;
        case 'MultiPoint':
        case 'Point':
            return (type & GeometryType.Point) !== 0;
    }
}

export function labelPosition(
    geometry: _ModuleSupport.Geometry,
    size: { width: number; height: number },
    options: { precision: number; filter?: GeometryType }
): _ModuleSupport.Position | undefined {
    const { precision, filter = GeometryType.Any } = options;

    switch (geometry.type) {
        case 'GeometryCollection': {
            const points: _ModuleSupport.Position[] = [];
            for (const g of geometry.geometries) {
                const point = labelPosition(g, size, options);
                if (point != null) {
                    points.push(point);
                }
            }
            return pointsCenter(points);
        }
        case 'MultiPolygon': {
            if ((filter & GeometryType.Polygon) === 0) return undefined;

            let largestArea: number | undefined;
            let largestPolygon: _ModuleSupport.Position[][] | undefined;
            geometry.coordinates.map((polygon) => {
                const bbox = polygonBbox(polygon[0], undefined);
                if (bbox == null) return;

                const area = Math.abs(bbox.lat1 - bbox.lat0) * Math.abs(bbox.lon1 - bbox.lon0);
                if (largestArea == null || area > largestArea) {
                    largestArea = area;
                    largestPolygon = polygon;
                }
            });
            return largestPolygon != null ? preferredLabelCenter(largestPolygon, size, precision) : undefined;
        }
        case 'Polygon':
            if ((filter & GeometryType.Polygon) === 0) return undefined;
            return preferredLabelCenter(geometry.coordinates, size, precision);
        case 'MultiLineString': {
            if ((filter & GeometryType.LineString) === 0) return undefined;
            let largestLength = 0;
            let largestLineString: _ModuleSupport.Position[] | undefined;
            geometry.coordinates.forEach((lineString) => {
                const length = lineStringLength(lineString);

                if (length > largestLength) {
                    largestLength = length;
                    largestLineString = lineString;
                }
            });
            return largestLineString != null ? lineStringCenter(largestLineString)?.point : undefined;
        }
        case 'LineString':
            if ((filter & GeometryType.LineString) === 0) return undefined;
            return lineStringCenter(geometry.coordinates)?.point;
        case 'MultiPoint':
            if ((filter & GeometryType.Point) === 0) return undefined;
            return pointsCenter(geometry.coordinates);
        case 'Point':
            if ((filter & GeometryType.Point) === 0) return undefined;
            return geometry.coordinates;
    }
}

export function markerPositions(geometry: _ModuleSupport.Geometry, precision: number): _ModuleSupport.Position[] {
    if (geometry.type === 'GeometryCollection') {
        return geometry.geometries.flatMap((g) => markerPositions(g, precision));
    } else if (geometry.type === 'MultiPoint') {
        return geometry.coordinates;
    }

    const center = labelPosition(geometry, { width: 0, height: 0 }, { precision });
    return center != null ? [center] : [];
}

export function projectGeometry(
    geometry: _ModuleSupport.Geometry,
    scale: _ModuleSupport.MercatorScale
): _ModuleSupport.Geometry {
    switch (geometry.type) {
        case 'GeometryCollection':
            return {
                type: 'GeometryCollection',
                geometries: geometry.geometries.map((g) => projectGeometry(g, scale)),
            };
        case 'Polygon':
            return {
                type: 'Polygon',
                coordinates: projectPolygon(geometry.coordinates, scale),
            };
        case 'MultiPolygon':
            return {
                type: 'MultiPolygon',
                coordinates: projectMultiPolygon(geometry.coordinates, scale),
            };
        case 'MultiLineString':
            return {
                type: 'MultiLineString',
                coordinates: projectPolygon(geometry.coordinates, scale),
            };
        case 'LineString':
            return {
                type: 'LineString',
                coordinates: projectLineString(geometry.coordinates, scale),
            };
        case 'MultiPoint':
            return {
                type: 'MultiPoint',
                coordinates: projectLineString(geometry.coordinates, scale),
            };
        case 'Point':
            return {
                type: 'Point',
                coordinates: scale.convert(geometry.coordinates),
            };
    }
}

function projectMultiPolygon(
    multiPolygon: _ModuleSupport.Position[][][],
    scale: _ModuleSupport.MercatorScale
): _ModuleSupport.Position[][][] {
    return multiPolygon.map((polygon) => projectPolygon(polygon, scale));
}

function projectPolygon(
    polygon: _ModuleSupport.Position[][],
    scale: _ModuleSupport.MercatorScale
): _ModuleSupport.Position[][] {
    return polygon.map((lineString) => projectLineString(lineString, scale));
}

function projectLineString(
    lineString: _ModuleSupport.Position[],
    scale: _ModuleSupport.MercatorScale
): _ModuleSupport.Position[] {
    return lineString.map((lonLat) => scale.convert(lonLat));
}
