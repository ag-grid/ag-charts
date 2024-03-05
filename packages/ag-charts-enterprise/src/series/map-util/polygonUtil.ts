import type { Position } from 'geojson';

import type { _ModuleSupport } from 'ag-charts-community';

import { extendBbox } from './bboxUtil';
import { lineSegmentDistanceSquared } from './lineStringUtil';
import { type List, insertManySorted } from './linkedList';

export function polygonBbox(
    polygon: Position[],
    into: _ModuleSupport.LonLatBBox | undefined
): _ModuleSupport.LonLatBBox | undefined {
    polygon.forEach((coordinates) => {
        const [lon, lat] = coordinates;
        into = extendBbox(into, lon, lat, lon, lat);
    });

    return into;
}

export function polygonCentroid(polygon: Position[]): Position | undefined {
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

function cellValue(distanceToPolygon: number, distanceToCentroid: number) {
    return distanceToPolygon - 0.5 * distanceToCentroid;
}

export function inaccessibilityPole(polygons: Position[][], precision: number): Position | undefined {
    const bbox = polygonBbox(polygons[0], undefined);
    if (bbox == null) return;

    const centroid = polygonCentroid(polygons[0])!;
    let [bestX, bestY] = centroid;
    let bestValue = cellValue(polygonDistance(polygons, bestX, bestY), 0);

    let queue: List<LabelPlacement> = {
        value: new LabelPlacement(
            polygons,
            centroid,
            (bbox.lon0 + bbox.lon1) / 2,
            (bbox.lat0 + bbox.lat1) / 2,
            Math.abs(bbox.lon1 - bbox.lon0),
            Math.abs(bbox.lat1 - bbox.lat0)
        ),
        next: null,
    };

    while (queue != null) {
        const { value, maxValue, x, y, width, height } = queue.value;
        queue = queue.next;

        if (value > bestValue) {
            bestValue = value;
            bestX = x;
            bestY = y;
        }

        if (maxValue - bestValue <= precision) {
            continue;
        }

        let newLabelPlacements: LabelPlacement[];
        if (width > height) {
            newLabelPlacements = [
                new LabelPlacement(polygons, centroid, x - width / 2, y, width / 2, height),
                new LabelPlacement(polygons, centroid, x + width / 2, y, width / 2, height),
            ];
        } else {
            newLabelPlacements = [
                new LabelPlacement(polygons, centroid, x, y - height / 2, width, height / 2),
                new LabelPlacement(polygons, centroid, x, y + height / 2, width, height / 2),
            ];
        }

        newLabelPlacements.sort(labelPlacementCmp);

        queue = insertManySorted(queue, newLabelPlacements, labelPlacementCmp);
    }

    return [bestX, bestY];
}

const labelPlacementCmp = (a: LabelPlacement, b: LabelPlacement) => a.maxValue - b.maxValue;

class LabelPlacement {
    value: number;
    maxValue: number;

    constructor(
        polygons: Position[][],
        centroid: Position,
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {
        const [cx, cy] = centroid;
        const distanceToPolygon = -polygonDistance(polygons, x, y);
        const distanceToCentroid = Math.hypot(cx - x, cy - y);

        const maxDistanceToPolygon = distanceToPolygon + Math.hypot(width / 2, height / 2);
        const maxXTowardsCentroid = Math.min(Math.max(cx, x - width / 2), x + width / 2);
        const maxYTowardsCentroid = Math.min(Math.max(cy, y - height / 2), y + height / 2);
        const minDistanceToCentroid = Math.hypot(cx - maxXTowardsCentroid, cy - maxYTowardsCentroid);

        this.value = cellValue(distanceToPolygon, distanceToCentroid);
        this.maxValue = cellValue(maxDistanceToPolygon, minDistanceToCentroid);
    }
}

/** Distance from a point to a polygon. Negative if inside the polygon. */
export function polygonDistance(polygons: Position[][], x: number, y: number) {
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

            minDistanceSquared = Math.min(minDistanceSquared, lineSegmentDistanceSquared(p0, p1, x, y));
            p0 = p1;
            x0 = x1;
            y0 = y1;
        }
    }

    return (inside ? -1 : 1) * Math.sqrt(minDistanceSquared);
}
