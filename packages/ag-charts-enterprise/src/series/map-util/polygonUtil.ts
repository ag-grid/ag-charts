import type { _ModuleSupport } from 'ag-charts-community';

import { extendBbox } from './bboxUtil';
import { lineSegmentDistanceToPointSquared, lineSegmentDistanceToRectSquared } from './lineStringUtil';
import { type List, insertManySorted } from './linkedList';

export function polygonBbox(
    polygon: _ModuleSupport.Position[],
    into: _ModuleSupport.LonLatBBox | undefined
): _ModuleSupport.LonLatBBox | undefined {
    polygon.forEach((coordinates) => {
        const [lon, lat] = coordinates;
        into = extendBbox(into, lon, lat, lon, lat);
    });

    return into;
}

export function polygonCentroid(polygon: _ModuleSupport.Position[]): _ModuleSupport.Position | undefined {
    if (polygon.length === 0) return;

    let x = 0;
    let y = 0;
    let k = 0;
    let [x0, y0] = polygon[polygon.length - 1];

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

function cellValue(distanceToPolygon: number, distanceToCentroid: number, centroidDistanceToPolygon: number) {
    const centroidDrift = Math.max(distanceToCentroid - centroidDistanceToPolygon, 0);
    return Math.max(distanceToPolygon - 0.25 * centroidDrift, 0);
}

interface LabelPlacement {
    maxValue: number;
    x: number;
    y: number;
    stride: number;
}

export function preferredLabelCenter(
    polygons: _ModuleSupport.Position[][],
    size: { width: number; height: number },
    precision: number
): _ModuleSupport.Position | undefined {
    const bbox = polygonBbox(polygons[0], undefined);
    if (bbox == null) return;

    const centroid = polygonCentroid(polygons[0])!;
    const [cx, cy] = centroid;
    const centroidDistanceToPolygon = -polygonRectDistance(polygons, centroid, { width: 0, height: 0 });
    let bestValue = 0;
    let bestCenter: _ModuleSupport.Position | undefined;

    const createLabelPlacement = (x: number, y: number, stride: number) => {
        const center: _ModuleSupport.Position = [x, y];
        const distanceToPolygon = -polygonRectDistance(polygons, center, size);
        const distanceToCentroid = Math.hypot(cx - x, cy - y);

        const maxDistanceToPolygon = distanceToPolygon + stride * Math.SQRT2;
        const maxXTowardsCentroid = Math.min(Math.max(cx, x - stride / 2), x + stride / 2);
        const maxYTowardsCentroid = Math.min(Math.max(cy, y - stride / 2), y + stride / 2);
        const minDistanceToCentroid = Math.hypot(cx - maxXTowardsCentroid, cy - maxYTowardsCentroid);

        const value = cellValue(distanceToPolygon, distanceToCentroid, centroidDistanceToPolygon);
        const maxValue = cellValue(maxDistanceToPolygon, minDistanceToCentroid, centroidDistanceToPolygon);

        if (distanceToPolygon > 0 && value > bestValue) {
            bestValue = value;
            bestCenter = center;
        }

        return { maxValue, x, y, stride };
    };

    const boundingXCenter = (bbox.lon0 + bbox.lon1) / 2;
    const boundingYCenter = (bbox.lat0 + bbox.lat1) / 2;
    const boundingWidth = Math.abs(bbox.lon1 - bbox.lon0);
    const boundingHeight = Math.abs(bbox.lon1 - bbox.lon0);
    const initialStride = Math.min(boundingWidth, boundingHeight) / 2;
    let queue: List<LabelPlacement> = {
        value: createLabelPlacement(boundingXCenter, boundingYCenter, initialStride),
        next: null,
    };

    while (queue != null) {
        const { maxValue, x, y, stride } = queue.value;
        queue = queue.next;

        if (maxValue - bestValue <= precision) {
            continue;
        }

        const nextStride = stride / 2;
        const newLabelPlacements = [
            createLabelPlacement(x - nextStride, y - nextStride, nextStride),
            createLabelPlacement(x + nextStride, y - nextStride, nextStride),
            createLabelPlacement(x - nextStride, y + nextStride, nextStride),
            createLabelPlacement(x + nextStride, y + nextStride, nextStride),
        ];

        newLabelPlacements.sort(labelPlacementCmp);

        queue = insertManySorted(queue, newLabelPlacements, labelPlacementCmp);
    }

    return bestCenter;
}

const labelPlacementCmp = (a: LabelPlacement, b: LabelPlacement) => a.maxValue - b.maxValue;

/** Distance from a point to a polygon. Negative if inside the polygon. */
export function polygonRectDistance(
    polygons: _ModuleSupport.Position[][],
    center: _ModuleSupport.Position,
    size: { width: number; height: number }
) {
    let inside = false;
    let minDistanceSquared = Infinity;

    const [cx, cy] = center;

    for (const polygon of polygons) {
        let p0 = polygon[polygon.length - 1];
        let [x0, y0] = p0;

        for (const p1 of polygon) {
            const [x1, y1] = p1;

            const distanceSquared = lineSegmentDistanceToRectSquared(p0, p1, center, size);

            const rectangleIntersectsPolygon = distanceSquared <= 0;
            if (rectangleIntersectsPolygon) return 0;

            if (y1 > cy !== y0 > cy && cx < ((x0 - x1) * (cy - y1)) / (y0 - y1) + x1) {
                inside = !inside;
            }

            minDistanceSquared = Math.min(minDistanceSquared, distanceSquared);
            p0 = p1;
            x0 = x1;
            y0 = y1;
        }
    }

    return (inside ? -1 : 1) * Math.sqrt(minDistanceSquared);
}

export function polygonDistance(polygons: _ModuleSupport.Position[][], x: number, y: number) {
    let inside = false;
    let minDistanceSquared = Infinity;

    for (const polygon of polygons) {
        let p0 = polygon[polygon.length - 1];
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
