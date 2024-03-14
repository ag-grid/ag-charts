import type { _ModuleSupport } from 'ag-charts-community';

import { largestLineString, largestPolygon } from './geometryUtil';
import { lineStringCenter } from './lineStringUtil';
import { polygonPointSearch } from './polygonPointSearch';
import { polygonDistance } from './polygonUtil';

export function polygonMarkerCenter(polygons: _ModuleSupport.Position[][], precision: number) {
    const result = polygonPointSearch(polygons, precision, (p, [x, y], stride) => {
        const distance = -polygonDistance(p, x, y);
        const maxDistance = distance + stride * Math.SQRT2;
        return { distance, maxDistance };
    });
    return result?.center;
}

export function markerPositions(geometry: _ModuleSupport.Geometry, precision: number): _ModuleSupport.Position[] {
    let center: _ModuleSupport.Position | undefined;
    switch (geometry.type) {
        case 'GeometryCollection':
            return geometry.geometries.flatMap((g) => markerPositions(g, precision));
        case 'MultiPoint':
            return geometry.coordinates;
        case 'Point':
            return [geometry.coordinates];
        case 'MultiPolygon': {
            const polygon = largestPolygon(geometry);
            center = polygon != null ? polygonMarkerCenter(polygon, precision) : undefined;
            break;
        }
        case 'Polygon': {
            const polygon = geometry.coordinates;
            center = polygon != null ? polygonMarkerCenter(polygon, precision) : undefined;
            break;
        }
        case 'MultiLineString': {
            const lineString = largestLineString(geometry);
            center = lineString != null ? lineStringCenter(lineString)?.point : undefined;
            break;
        }
        case 'LineString': {
            const lineString = geometry.coordinates;
            center = lineStringCenter(lineString)?.point;
            break;
        }
    }

    return center != null ? [center] : [];
}
