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
        // @todo(AG-10831) Handle anti-meridian
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
        case 'MultiPolygon':
            geometry.coordinates.forEach((c) => {
                if (c.length > 0) {
                    into = polygonBox(c[0], into);
                }
            });
            break;
        case 'Polygon':
            if (geometry.coordinates.length > 0) {
                into = polygonBox(geometry.coordinates[0], into);
            }
            break;
        case 'MultiLineString':
            geometry.coordinates.forEach((c) => {
                into = polygonBox(c, into);
            });
            break;
        case 'LineString':
            into = polygonBox(geometry.coordinates, into);
            break;
        case 'MultiPoint':
        case 'Point':
            break;
    }

    return into;
}

function polygonCentroid(polygon: Position[]): Position | undefined {
    if (polygon.length === 0) return;

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

function lineStringCenter(lineSegment: Position[]): { point: Position; angle: number } | undefined {
    if (lineSegment.length === 0) return;

    let [x0, y0] = lineSegment[0];
    let totalDistance = 0;
    for (let i = 1; i < lineSegment.length; i += 1) {
        const [x1, y1] = lineSegment[i];
        const distance = Math.hypot(x1 - x0, y1 - y0);
        totalDistance += distance;
        x0 = x1;
        y0 = y1;
    }

    const targetDistance = totalDistance / 2;

    [x0, y0] = lineSegment[0];
    totalDistance = 0;
    for (let i = 1; i < lineSegment.length; i += 1) {
        const [x1, y1] = lineSegment[i];
        const distance = Math.hypot(x1 - x0, y1 - y0);
        const nextDistance = totalDistance + distance;

        if (nextDistance > targetDistance) {
            const ratio = (targetDistance - distance) / totalDistance;
            const point = [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio];
            const angle = Math.atan2(y1 - y0, x1 - x0);

            return { point, angle };
        }

        totalDistance = nextDistance;
        x0 = x1;
        y0 = y1;
    }
}

function pointsCenter(points: Position[]): Position | undefined {
    if (points.length === 0) return;

    let [totalX, totalY] = points[0];
    for (let i = 1; i < points.length; i += 1) {
        const [x, y] = points[i];
        totalX += x;
        totalY += y;
    }

    return [totalX / points.length, totalY / points.length];
}

export function geometryCenter(geometry: Geometry): Position | undefined {
    switch (geometry.type) {
        case 'GeometryCollection': {
            const points: Position[] = [];
            for (const g of geometry.geometries) {
                const point = geometryCenter(g);
                if (point != null) {
                    points.push(point);
                }
            }
            return pointsCenter(points);
        }
        case 'MultiPolygon': {
            let largestSize: number | undefined;
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
        case 'Polygon':
            return polygonCentroid(geometry.coordinates[0]);
        case 'MultiLineString': {
            const points: Position[] = [];
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
