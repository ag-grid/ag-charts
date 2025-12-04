import { _ModuleSupport } from 'ag-charts-community';
import { type Geometry, LonLatBBox, type Position } from 'ag-charts-core';

import { lineStringLength } from './lineStringUtil';
import { polygonBbox } from './polygonUtil';

function calculatePolygonArea(polygon: Position[][]): number {
    const bbox = polygonBbox(polygon[0], undefined);
    if (bbox == null) return 0;
    return Math.abs(bbox.lat1 - bbox.lat0) * Math.abs(bbox.lon1 - bbox.lon0);
}

function findLargestByMetric<T>(items: T[], metric: (item: T) => number | undefined): T | undefined {
    let maxValue: number | undefined;
    let maxItem: T | undefined;

    for (const item of items) {
        const value = metric(item);
        if (value == null) continue;

        if (maxValue == null || value > maxValue) {
            maxValue = value;
            maxItem = item;
        }
    }

    return maxItem;
}

export function geometryBbox(geometry: Geometry, into: LonLatBBox | undefined): LonLatBBox | undefined {
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

export function largestPolygon(geometry: Geometry): Position[][] | undefined {
    switch (geometry.type) {
        case 'Polygon':
            return geometry.coordinates;
        case 'MultiPolygon':
            return findLargestByMetric(geometry.coordinates, calculatePolygonArea);
        case 'GeometryCollection': {
            const polygons = geometry.geometries.map(largestPolygon).filter((p): p is Position[][] => p != null);
            return findLargestByMetric(polygons, calculatePolygonArea);
        }
        case 'MultiLineString':
        case 'LineString':
        case 'MultiPoint':
        case 'Point':
            return;
    }
}

export function largestLineString(geometry: Geometry): Position[] | undefined {
    switch (geometry.type) {
        case 'LineString':
            return geometry.coordinates;
        case 'MultiLineString':
            return findLargestByMetric(geometry.coordinates, lineStringLength);
        case 'GeometryCollection': {
            const lineStrings = geometry.geometries.map(largestLineString).filter((l): l is Position[] => l != null);
            return findLargestByMetric(lineStrings, lineStringLength);
        }
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

export function containsType(geometry: Geometry | null, type: GeometryType): boolean {
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

export function projectGeometry(geometry: Geometry, scale: _ModuleSupport.MercatorScale): Geometry {
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

function projectMultiPolygon(multiPolygon: Position[][][], scale: _ModuleSupport.MercatorScale): Position[][][] {
    return multiPolygon.map((polygon) => projectPolygon(polygon, scale));
}

function projectPolygon(polygon: Position[][], scale: _ModuleSupport.MercatorScale): Position[][] {
    return polygon.map((lineString) => projectLineString(lineString, scale));
}

function projectLineString(lineString: Position[], scale: _ModuleSupport.MercatorScale): Position[] {
    return lineString.map((lonLat) => scale.convert(lonLat));
}
