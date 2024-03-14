import type { _ModuleSupport } from 'ag-charts-community';

import { type List, insertManySorted } from './linkedList';
import { polygonBbox, polygonCentroid, polygonDistance } from './polygonUtil';

interface LabelPlacement {
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
        center: _ModuleSupport.Position,
        stride: number
    ) => {
        distance: number;
        maxDistance: number;
    }
): { center: _ModuleSupport.Position; distance: number } | undefined {
    const bbox = polygonBbox(polygons[0], undefined);
    if (bbox == null) return;

    const boundingXCenter = (bbox.lon0 + bbox.lon1) / 2;
    const boundingYCenter = (bbox.lat0 + bbox.lat1) / 2;
    const boundingWidth = Math.abs(bbox.lon1 - bbox.lon0);
    const boundingHeight = Math.abs(bbox.lat1 - bbox.lat0);

    const centroid = polygonCentroid(polygons[0])!;
    const [cx, cy] = centroid;
    const centroidDistanceToPolygon = -polygonDistance(polygons, cx, cy);
    let bestValue = 0;
    let bestDistance = 0;
    let bestCenter: _ModuleSupport.Position | undefined;

    const cellValue = (distanceToPolygon: number, distanceToCentroid: number) => {
        const centroidDriftFactor = 1; // Increase to pull labels closer towards 'center'
        const centroidDrift = Math.max(distanceToCentroid - centroidDistanceToPolygon, 0);
        return Math.max(distanceToPolygon - centroidDriftFactor * centroidDrift, 0);
    };

    const createLabelPlacement = (x: number, y: number, stride: number): LabelPlacement => {
        const center: _ModuleSupport.Position = [x, y];
        const { distance, maxDistance } = valueFn(polygons, center, stride);
        const distanceToCentroid = Math.hypot(cx - x, cy - y);

        const maxXTowardsCentroid = Math.min(Math.max(cx, x - stride / 2), x + stride / 2);
        const maxYTowardsCentroid = Math.min(Math.max(cy, y - stride / 2), y + stride / 2);
        const minDistanceToCentroid = Math.hypot(cx - maxXTowardsCentroid, cy - maxYTowardsCentroid);

        const value = cellValue(distance, distanceToCentroid);
        const maxValue = cellValue(maxDistance, minDistanceToCentroid);

        if (distance > 0 && value > bestValue) {
            bestValue = value;
            bestDistance = distance;
            bestCenter = center;
        }

        return { maxValue, x, y, stride };
    };

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

    return bestCenter != null ? { center: bestCenter, distance: bestDistance } : undefined;
}

const labelPlacementCmp = (a: LabelPlacement, b: LabelPlacement) => a.maxValue - b.maxValue;
