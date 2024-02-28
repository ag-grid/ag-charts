import type { Geometry, Position } from 'geojson';

import { LatLongBBox } from './LatLongBBox';

const radsInDeg = Math.PI / 180;

export const lonX = (lng: number) => lng * radsInDeg;

export const latY = (lat: number) => -Math.log(Math.tan(Math.PI * 0.25 + lat * radsInDeg * 0.5));

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
