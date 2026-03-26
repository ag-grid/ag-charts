import type { Geometry, Position } from 'ag-charts-core';

import { largestLineString, largestPolygon } from './geometryUtil';
import { lineStringCenter } from './lineStringUtil';
import { polygonPointSearch } from './polygonPointSearch';
import { polygonDistance } from './polygonUtil';

export function polygonMarkerCenter(polygons: Position[][], precision: number): Position | undefined {
    const result = polygonPointSearch(polygons, precision, (p, x, y, stride) => {
        const distance = -polygonDistance(p, x, y);
        const maxDistance = distance + stride * Math.SQRT2;
        return { distance, maxDistance };
    });
    if (result == null) return;

    const { x, y } = result;
    return [x, y];
}

export function markerPositions(geometry: Geometry, precision: number): Position[] {
    let center: Position | undefined;
    switch (geometry.type) {
        case 'GeometryCollection':
            return geometry.geometries.flatMap((g) => markerPositions(g, precision));
        case 'MultiPoint':
            return geometry.coordinates;
        case 'Point':
            return [geometry.coordinates];
        case 'MultiPolygon': {
            const polygon = largestPolygon(geometry);
            center = polygon == null ? undefined : polygonMarkerCenter(polygon, precision);
            break;
        }
        case 'Polygon': {
            const polygon = geometry.coordinates;
            center = polygon == null ? undefined : polygonMarkerCenter(polygon, precision);
            break;
        }
        case 'MultiLineString': {
            const lineString = largestLineString(geometry);
            center = lineString == null ? undefined : lineStringCenter(lineString)?.point;
            break;
        }
        case 'LineString': {
            const lineString = geometry.coordinates;
            center = lineStringCenter(lineString)?.point;
            break;
        }
    }

    return center == null ? [] : [center];
}
