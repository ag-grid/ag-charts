import { type BoxBounds, type Point, boxCollides, boxContains } from 'ag-charts-core';
import type { TextOrSegments } from 'ag-charts-types';

import type { SizedPoint } from '../interfaces/sceneTypes';

export type LabelPlacement =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

export interface MeasuredLabel {
    readonly text: TextOrSegments;
    readonly width: number;
    readonly height: number;
}

export interface PointLabelDatum {
    readonly point: Readonly<SizedPoint>;
    readonly label: MeasuredLabel;
    readonly anchor: Point | undefined;
    readonly placement: LabelPlacement | undefined;
}

export interface PlacedLabel<PLD = PointLabelDatum> extends MeasuredLabel, Readonly<Point> {
    readonly index: number;
    readonly datum: PLD;
}

function circleRectOverlap(
    { point: c, anchor: unitCenter }: PointLabelDatum,
    x: number,
    y: number,
    w: number,
    h: number
): boolean {
    if (c.size === 0) {
        return false;
    }

    let cx = c.x;
    let cy = c.y;

    if (unitCenter != null) {
        cx -= (unitCenter.x - 0.5) * c.size;
        cy -= (unitCenter.y - 0.5) * c.size;
    }

    // Find the closest horizontal and vertical edges.
    let edgeX = cx;
    if (cx < x) {
        edgeX = x;
    } else if (cx > x + w) {
        edgeX = x + w;
    }
    let edgeY = cy;
    if (cy < y) {
        edgeY = y;
    } else if (cy > y + h) {
        edgeY = y + h;
    }
    // Find distance to the closest edges.
    const dx = cx - edgeX;
    const dy = cy - edgeY;
    const d = Math.hypot(dx, dy);
    return d <= c.size / 2;
}

export function isPointLabelDatum(x: any): x is PointLabelDatum {
    return x != null && typeof x.point === 'object' && typeof x.label === 'object';
}

const labelPlacements: Record<LabelPlacement, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    'top-left': { x: -1, y: -1 },
    'top-right': { x: 1, y: -1 },
    'bottom-left': { x: -1, y: 1 },
    'bottom-right': { x: 1, y: 1 },
};

/**
 * @param data Points and labels for one or more series. The order of series determines label placement precedence.
 * @param bounds Bounds to fit the labels into. If a label can't be fully contained, it doesn't fit.
 * @param padding
 * @returns Placed labels for all series.
 */
export function placeLabels(data: Map<string, PointLabelDatum[]>, bounds: BoxBounds, padding = 5) {
    const result: Map<string, PlacedLabel[]> = new Map();
    const previousResults: PlacedLabel[] = [];

    const sortedDataClone = new Map(
        Array.from(data.entries(), ([k, d]) => [k, d.toSorted((a, b) => b.point.size - a.point.size)])
    );
    const dataValues = [...sortedDataClone.values()].flat();
    for (const [seriesId, datums] of sortedDataClone.entries()) {
        const labels: PlacedLabel[] = [];
        if (!datums[0]?.label) continue;
        for (let index = 0, ln = datums.length; index < ln; index++) {
            const d = datums[index];
            const { point, label, anchor } = d;
            const { text, width, height } = label;
            const r = point.size / 2;
            let dx = 0;
            let dy = 0;
            if (r > 0 && d.placement != null) {
                const placement = labelPlacements[d.placement];
                dx = (width / 2 + r + padding) * placement.x;
                dy = (height / 2 + r + padding) * placement.y;
            }

            let x = point.x - width / 2 + dx;
            let y = point.y - height / 2 + dy;

            if (anchor) {
                x -= (anchor.x - 0.5) * point.size;
                y -= (anchor.y - 0.5) * point.size;
            }

            if (
                boxContains(bounds, x, y, width, height) &&
                !dataValues.some((dataDatum) => circleRectOverlap(dataDatum, x, y, width, height)) &&
                !previousResults.some((pr) => boxCollides(pr, x, y, width, height))
            ) {
                const resultDatum = { index, text, x, y, width, height, datum: d };
                labels.push(resultDatum);
                previousResults.push(resultDatum);
            }
        }

        result.set(seriesId, labels);
    }

    return result;
}
