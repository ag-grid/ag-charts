import type { Geometry, Position } from 'geojson';

import type { _ModuleSupport } from 'ag-charts-community';

import { extendBbox } from './bboxUtil';
import { lineStringCenter } from './lineStringUtil';
import { inaccessibilityPole, polygonBbox } from './polygonUtil';

export function geometryBbox(
    geometry: Geometry,
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

function pointsCenter(points: Position[]): Position | undefined {
    if (points.length === 0) return;

    let totalX = 0;
    let totalY = 0;
    for (const [x, y] of points) {
        totalX += x;
        totalY += y;
    }

    return [totalX / points.length, totalY / points.length];
}

function positionToUnknownDistance(
    position: Position | undefined
): { x: number; y: number; distance: number } | undefined {
    if (position == null) return;
    const [x, y] = position;
    return { x, y, distance: Infinity };
}

export function geometryCenter(
    geometry: Geometry,
    precision: number
): { x: number; y: number; distance: number } | undefined {
    switch (geometry.type) {
        case 'GeometryCollection': {
            const points: Position[] = [];
            for (const g of geometry.geometries) {
                const point = geometryCenter(g, precision);
                if (point != null) {
                    const { x, y } = point;
                    points.push([x, y]);
                }
            }
            return positionToUnknownDistance(pointsCenter(points));
        }
        case 'MultiPolygon': {
            let largestSize: number | undefined;
            let largestPolygon: Position[][] | undefined;
            geometry.coordinates.map((polygon) => {
                const bbox = polygonBbox(polygon[0], undefined);
                if (bbox == null) return;

                const size = Math.abs(bbox.lat1 - bbox.lat0) * Math.abs(bbox.lon1 - bbox.lon0);
                if (largestSize == null || size > largestSize) {
                    largestSize = size;
                    largestPolygon = polygon;
                }
            });
            return largestPolygon != null ? inaccessibilityPole(largestPolygon, precision) : undefined;
        }
        case 'Polygon':
            return inaccessibilityPole(geometry.coordinates, precision);
        case 'MultiLineString': {
            const points: Position[] = [];
            for (const c of geometry.coordinates) {
                const center = lineStringCenter(c);
                if (center != null) {
                    points.push(center.point);
                }
            }
            return positionToUnknownDistance(pointsCenter(points));
        }
        case 'LineString':
            return positionToUnknownDistance(lineStringCenter(geometry.coordinates)?.point);
        case 'MultiPoint':
            return positionToUnknownDistance(pointsCenter(geometry.coordinates));
        case 'Point':
            return positionToUnknownDistance(geometry.coordinates);
    }
}

export function markerCenters(geometry: Geometry): Position[] {
    switch (geometry.type) {
        case 'GeometryCollection':
            return geometry.geometries.flatMap(markerCenters);
        case 'MultiPolygon':
        case 'Polygon':
        case 'MultiLineString':
        case 'LineString':
            return [];
        case 'MultiPoint':
            return geometry.coordinates;
        case 'Point':
            return [geometry.coordinates];
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

function projectMultiPolygon(polygons: Position[][][], scale: _ModuleSupport.MercatorScale): Position[][][] {
    return polygons.map((polygon) => projectPolygon(polygon, scale));
}

function projectPolygon(polygon: Position[][], scale: _ModuleSupport.MercatorScale): Position[][] {
    return polygon.map((lineString) => projectLineString(lineString, scale));
}

function projectLineString(lineString: Position[], scale: _ModuleSupport.MercatorScale): Position[] {
    return lineString.map((lonLat) => scale.convert(lonLat));
}
