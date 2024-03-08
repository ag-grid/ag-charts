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

export function labelPosition(
    geometry: _ModuleSupport.Geometry,
    size: { width: number; height: number },
    precision: number
): _ModuleSupport.Position | undefined {
    switch (geometry.type) {
        case 'GeometryCollection': {
            const points: _ModuleSupport.Position[] = [];
            for (const g of geometry.geometries) {
                const point = labelPosition(g, size, precision);
                if (point != null) {
                    points.push(point);
                }
            }
            return pointsCenter(points);
        }
        case 'MultiPolygon': {
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
            return preferredLabelCenter(geometry.coordinates, size, precision);
        case 'MultiLineString': {
            const points: _ModuleSupport.Position[] = [];
            for (const c of geometry.coordinates) {
                const center = lineStringCenter(c);
                if (center != null) {
                    points.push(center.point);
                }
            }
            return pointsCenter(points);
        }
        case 'LineString':
            return lineStringCenter(geometry.coordinates)?.point;
        case 'MultiPoint':
            return pointsCenter(geometry.coordinates);
        case 'Point':
            return geometry.coordinates;
    }
}

export function markerPositions(geometry: _ModuleSupport.Geometry, precision: number): _ModuleSupport.Position[] {
    switch (geometry.type) {
        case 'GeometryCollection':
            return geometry.geometries.flatMap(markerPositions);
        case 'MultiPolygon': {
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
            const center =
                largestPolygon != null
                    ? preferredLabelCenter(largestPolygon, { width: 0, height: 0 }, precision)
                    : undefined;
            return center != null ? [center] : [];
        }
        case 'Polygon': {
            const center = preferredLabelCenter(geometry.coordinates, { width: 0, height: 0 }, precision);
            return center != null ? [center] : [];
        }
        case 'MultiLineString': {
            let largestLength = 0;
            let largestLineString: _ModuleSupport.Position[] | undefined;
            geometry.coordinates.forEach((lineString) => {
                const length = lineStringLength(lineString);

                if (length > largestLength) {
                    largestLength = length;
                    largestLineString = lineString;
                }
            });
            const center = largestLineString != null ? lineStringCenter(largestLineString)?.point : undefined;
            return center != null ? [center] : [];
        }
        case 'LineString': {
            const center = lineStringCenter(geometry.coordinates)?.point;
            return center != null ? [center] : [];
        }
        case 'MultiPoint':
            return geometry.coordinates;
        case 'Point':
            return [geometry.coordinates];
    }
    return [];
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
    polygons: _ModuleSupport.Position[][][],
    scale: _ModuleSupport.MercatorScale
): _ModuleSupport.Position[][][] {
    return polygons.map((polygon) => projectPolygon(polygon, scale));
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
