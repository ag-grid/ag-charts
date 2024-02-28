import type { Geometry, Position } from 'geojson';

import { LatLongBBox } from './LatLongBBox';

function extendBbox(
    into: LatLongBBox | undefined,
    lat0: number,
    lon0: number,
    lat1: number,
    lon1: number
): LatLongBBox {
    if (into == null) {
        into = new LatLongBBox(lat0, lon0, lat1, lon1);
    } else {
        // @todo(AG-10831) Handle antimeridian
        into.lat0 = Math.min(into.lat0, lat0);
        into.lon0 = Math.min(into.lon0, lon0);
        into.lat1 = Math.max(into.lat1, lat0);
        into.lon1 = Math.max(into.lon1, lon0);
    }

    return into;
}

export function polygonBox(polygons: Position[], into: LatLongBBox | undefined): LatLongBBox | undefined {
    polygons.forEach((coordinates) => {
        const [lon, lat] = coordinates;
        into = extendBbox(into, lat, lon, lat, lon);
    });

    return into;
}

export function geometryBox(geometry: Geometry, into: LatLongBBox | undefined): LatLongBBox | undefined {
    if (geometry.bbox != null) {
        const [lon0, lat0, lon1, lat1] = geometry.bbox;
        into = extendBbox(into, lat0, lon0, lat1, lon1);
        return into;
    }

    switch (geometry.type) {
        case 'GeometryCollection':
            geometry.geometries.forEach((g) => {
                into = geometryBox(g, into);
            });
            break;
        case 'Polygon':
            if (geometry.coordinates.length > 0) {
                into = polygonBox(geometry.coordinates[0], into);
            }
            break;
        case 'MultiPolygon':
            geometry.coordinates.forEach((c) => {
                if (c.length > 0) {
                    into = polygonBox(c[0], into);
                }
            });
            break;
        case 'LineString':
            into = polygonBox(geometry.coordinates, into);
            break;
        case 'MultiLineString':
            geometry.coordinates.forEach((c) => {
                into = polygonBox(c, into);
            });
            break;
        case 'MultiPoint':
        case 'Point':
            break;
    }

    return into;
}

function polygonCentroid(polygon: Position[]): Position | undefined {
    if (polygon.length === 0) return undefined;

    let x = 0;
    let y = 0;
    let a: Position;
    let b = polygon[polygon.length - 1];
    let k = 0;

    for (let i = 0; i < polygon.length; i += 1) {
        a = b;
        b = polygon[i];
        const c = a[0] * b[1] - b[0] * a[1];
        k += c;
        x += (a[0] + b[0]) * c;
        y += (a[1] + b[1]) * c;
    }

    k *= 3;

    return [x / k, y / k];
}

export function geometryCentroid(geometry: Geometry): Position | undefined {
    switch (geometry.type) {
        case 'Polygon':
            return polygonCentroid(geometry.coordinates[0]);
        case 'MultiPolygon': {
            let largestSize: number | undefined = undefined;
            let largestPolygon: Position[] | undefined;
            geometry.coordinates.map((coordinates) => {
                const polygon = coordinates[0];
                const bbox = polygonBox(polygon, undefined);
                if (bbox == null) return;

                const size = Math.abs(bbox.lat1 - bbox.lat0) * Math.abs(bbox.lon1 - bbox.lon0);
                if (largestSize == null || size > largestSize) {
                    largestSize = size;
                    largestPolygon = polygon;
                }
            });
            return largestPolygon != null ? polygonCentroid(largestPolygon) : undefined;
        }
        case 'GeometryCollection':
        case 'MultiLineString':
        case 'LineString':
        case 'MultiPoint':
        case 'Point':
            return undefined;
    }
}
