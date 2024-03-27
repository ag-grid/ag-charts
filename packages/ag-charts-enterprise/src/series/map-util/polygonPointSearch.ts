import type { _ModuleSupport } from 'ag-charts-community';

import { type List, insertManySorted } from './linkedList';
import { polygonBbox, polygonCentroid, polygonDistance } from './polygonUtil';

interface LabelPlacement {
    distance: number;
    maxDistance: number;
    value: number;
    maxValue: number;
    x: number;
    y: number;
    stride: number;
}

export function polygonPointSearch(
    polygons: _ModuleSupport.Position[][],
    precision: number,
    valueFn: (
        polygons: _ModuleSupport.Position[][],
        x: number,
        y: number,
        stride: number
    ) => {
        distance: number;
        maxDistance: number;
    }
): { x: number; y: number; distance: number } | undefined {
    const bbox = polygonBbox(polygons[0], undefined);
    if (bbox == null) return;

    const boundingXCenter = (bbox.lon0 + bbox.lon1) / 2;
    const boundingYCenter = (bbox.lat0 + bbox.lat1) / 2;
    const boundingWidth = Math.abs(bbox.lon1 - bbox.lon0);
    const boundingHeight = Math.abs(bbox.lat1 - bbox.lat0);

    const centroid = polygonCentroid(polygons[0])!;
    const [cx, cy] = centroid;
    const centroidDistanceToPolygon = -polygonDistance(polygons, cx, cy);
    let bestResult: LabelPlacement | undefined;

    const cellValue = (distanceToPolygon: number, distanceToCentroid: number) => {
        const centroidDriftFactor = 0.5; // Increase to pull labels closer towards 'center'
        const centroidDrift = Math.max(distanceToCentroid - centroidDistanceToPolygon, 0);
        return distanceToPolygon - centroidDriftFactor * centroidDrift;
    };

    const createLabelPlacement = (x: number, y: number, stride: number): LabelPlacement => {
        const { distance, maxDistance } = valueFn(polygons, x, y, stride);

        const distanceToCentroid = Math.hypot(cx - x, cy - y);

        const maxXTowardsCentroid = Math.min(Math.max(cx, x - stride / 2), x + stride / 2);
        const maxYTowardsCentroid = Math.min(Math.max(cy, y - stride / 2), y + stride / 2);
        const minDistanceToCentroid = Math.hypot(cx - maxXTowardsCentroid, cy - maxYTowardsCentroid);

        const value = cellValue(distance, distanceToCentroid);
        const maxValue = cellValue(maxDistance, minDistanceToCentroid);

        return { distance, maxDistance, value, maxValue, x, y, stride };
    };

    const appendLabelPlacement = (into: LabelPlacement[], x: number, y: number, stride: number) => {
        const labelPlacement = createLabelPlacement(x, y, stride);
        if (labelPlacement.maxDistance >= 0) {
            into.push(labelPlacement);
        }
    };

    const initialStride = Math.min(boundingWidth, boundingHeight) / 2;
    let queue: List<LabelPlacement> = {
        value: createLabelPlacement(boundingXCenter, boundingYCenter, initialStride),
        next: null,
    };

    while (queue != null) {
        const item = queue.value;
        const { distance, value, maxValue, x, y, stride } = item;
        queue = queue.next;

        if (distance > 0 && (bestResult == null || value > bestResult.value)) {
            bestResult = item;
        }

        if (bestResult != null && maxValue - bestResult.value <= precision) {
            continue;
        }

        const nextStride = stride / 2;
        const newLabelPlacements: LabelPlacement[] = [];
        appendLabelPlacement(newLabelPlacements, x - nextStride, y - nextStride, nextStride);
        appendLabelPlacement(newLabelPlacements, x + nextStride, y - nextStride, nextStride);
        appendLabelPlacement(newLabelPlacements, x - nextStride, y + nextStride, nextStride);
        appendLabelPlacement(newLabelPlacements, x + nextStride, y + nextStride, nextStride);

        newLabelPlacements.sort(labelPlacementCmp);

        queue = insertManySorted(queue, newLabelPlacements, labelPlacementCmp);
    }

    if (bestResult == null) return;

    const { distance, x, y } = bestResult;
    return { x, y, distance };
}

const labelPlacementCmp = (a: LabelPlacement, b: LabelPlacement) => b.maxValue - a.maxValue;
