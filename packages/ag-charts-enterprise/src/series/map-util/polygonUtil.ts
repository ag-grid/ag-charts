import { LonLatBBox, type Position } from 'ag-charts-core';

import { lineSegmentDistanceToPointSquared } from './lineStringUtil';

export function polygonBbox(polygon: Position[], into: LonLatBBox | undefined): LonLatBBox | undefined {
    for (const coordinates of polygon) {
        const [lon, lat] = coordinates;
        into = LonLatBBox.extend(into, lon, lat, lon, lat);
    }

    return into;
}

export function polygonCentroid(polygon: Position[]): Position | undefined {
    if (polygon.length === 0) return;

    let x = 0;
    let y = 0;
    let k = 0;
    let [x0, y0] = polygon.at(-1)!;

    for (const [x1, y1] of polygon) {
        const c = x0 * y1 - x1 * y0;
        k += c;
        x += (x0 + x1) * c;
        y += (y0 + y1) * c;
        x0 = x1;
        y0 = y1;
    }

    k *= 3;

    return [x / k, y / k];
}

/** Distance from a point to a polygon. Negative if inside the polygon. */

export function polygonDistance(polygons: Position[][], x: number, y: number) {
    let inside = false;
    let minDistanceSquared = Infinity;

    for (const polygon of polygons) {
        let p0 = polygon.at(-1)!;
        let [x0, y0] = p0;

        for (const p1 of polygon) {
            const [x1, y1] = p1;

            if (y1 > y !== y0 > y && x < ((x0 - x1) * (y - y1)) / (y0 - y1) + x1) {
                inside = !inside;
            }

            minDistanceSquared = Math.min(minDistanceSquared, lineSegmentDistanceToPointSquared(p0, p1, x, y));
            p0 = p1;
            x0 = x1;
            y0 = y1;
        }
    }

    return (inside ? -1 : 1) * Math.sqrt(minDistanceSquared);
}
