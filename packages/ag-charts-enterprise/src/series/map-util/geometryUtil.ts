import { _ModuleSupport } from 'ag-charts-community';

import { lineStringLength } from './lineStringUtil';
import { polygonBbox } from './polygonUtil';

const { LonLatBBox } = _ModuleSupport;

export function geometryBbox(
    geometry: _ModuleSupport.Geometry,
    into: _ModuleSupport.LonLatBBox | undefined
): _ModuleSupport.LonLatBBox | undefined {
    if (geometry.bbox != null) {
        const [lon0, lat0, lon1, lat1] = geometry.bbox;
        into = LonLatBBox.extend(into, lon0, lat0, lon1, lat1);
        return into;
    }

    switch (geometry.type) {
        case 'GeometryCollection':
            for (const g of geometry.geometries) {
                into = geometryBbox(g, into);
            }
            break;
        case 'MultiPolygon':
            for (const c of geometry.coordinates) {
                if (c.length > 0) {
                    into = polygonBbox(c[0], into);
                }
            }
            break;
        case 'Polygon':
            if (geometry.coordinates.length > 0) {
                into = polygonBbox(geometry.coordinates[0], into);
            }
            break;
        case 'MultiLineString':
            for (const c of geometry.coordinates) {
                into = polygonBbox(c, into);
            }
            break;
        case 'LineString':
            into = polygonBbox(geometry.coordinates, into);
            break;
        case 'MultiPoint':
            for (const p of geometry.coordinates) {
                const [lon, lat] = p;
                into = LonLatBBox.extend(into, lon, lat, lon, lat);
            }
            break;
        case 'Point': {
            const [lon, lat] = geometry.coordinates;
            into = LonLatBBox.extend(into, lon, lat, lon, lat);
            break;
        }
    }

    return into;
}

export function largestPolygon(geometry: _ModuleSupport.Geometry): _ModuleSupport.Position[][] | undefined {
    switch (geometry.type) {
        case 'GeometryCollection': {
            let maxArea: number | undefined;
            let maxPolygon: _ModuleSupport.Position[][] | undefined;
            for (const g of geometry.geometries) {
                const polygon = largestPolygon(g);
                if (polygon == null) continue;

                const bbox = polygonBbox(polygon[0], undefined);
                if (bbox == null) continue;

                const area = Math.abs(bbox.lat1 - bbox.lat0) * Math.abs(bbox.lon1 - bbox.lon0);
                if (maxArea == null || area > maxArea) {
                    maxArea = area;
                    maxPolygon = polygon;
                }
            }
            return maxPolygon;
        }
        case 'MultiPolygon': {
            let maxArea: number | undefined;
            let maxPolygon: _ModuleSupport.Position[][] | undefined;
            for (const polygon of geometry.coordinates) {
                const bbox = polygonBbox(polygon[0], undefined);
                if (bbox == null) continue;

                const area = Math.abs(bbox.lat1 - bbox.lat0) * Math.abs(bbox.lon1 - bbox.lon0);
                if (maxArea == null || area > maxArea) {
                    maxArea = area;
                    maxPolygon = polygon;
                }
            }
            return maxPolygon;
        }
        case 'Polygon':
            return geometry.coordinates;
        case 'MultiLineString':
        case 'LineString':
        case 'MultiPoint':
        case 'Point':
            return;
    }
}

export function largestLineString(geometry: _ModuleSupport.Geometry): _ModuleSupport.Position[] | undefined {
    switch (geometry.type) {
        case 'GeometryCollection': {
            let maxLength: number | undefined;
            let maxLineString: _ModuleSupport.Position[] | undefined;
            for (const g of geometry.geometries) {
                const lineString = largestLineString(g);
                if (lineString == null) continue;

                const length = lineStringLength(lineString);
                if (length == null) continue;

                if (maxLength == null || length > maxLength) {
                    maxLength = length;
                    maxLineString = lineString;
                }
            }
            return maxLineString;
        }
        case 'MultiLineString': {
            let maxLength = 0;
            let maxLineString: _ModuleSupport.Position[] | undefined;
            for (const lineString of geometry.coordinates) {
                const length = lineStringLength(lineString);

                if (length > maxLength) {
                    maxLength = length;
                    maxLineString = lineString;
                }
            }
            return maxLineString;
        }
        case 'LineString':
            return geometry.coordinates;
        case 'MultiPolygon':
        case 'Polygon':
        case 'MultiPoint':
        case 'Point':
            return;
    }
}

export enum GeometryType {
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
