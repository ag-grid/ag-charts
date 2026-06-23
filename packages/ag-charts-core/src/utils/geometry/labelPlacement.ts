import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { Point, SizedPoint } from '../../types/scene';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import { SpatialIndex } from './spatialIndex';

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
    readonly text: NormalisedTextOrSegments;
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

// Scratch indices reused across passes (placeLabels is not reentrant in the single-threaded render loop).
const markerIndex = new SpatialIndex<PointLabelDatum>();
const placedIndex = new SpatialIndex<PlacedLabel>();
const candidateBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
const markerBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };

function markerOverlapsCandidate(datum: PointLabelDatum): boolean {
    return circleRectOverlap(datum, candidateBox.x, candidateBox.y, candidateBox.width, candidateBox.height);
}

function placedOverlapsCandidate(placed: PlacedLabel): boolean {
    return boxCollides(placed, candidateBox.x, candidateBox.y, candidateBox.width, candidateBox.height);
}

/**
 * @param data Points and labels for one or more series. The order of series determines label placement precedence.
 * @param bounds Bounds to fit the labels into. If a label can't be fully contained, it doesn't fit.
 * @param padding
 * @returns Placed labels for all series.
 */
export function placeLabels(data: Map<string, PointLabelDatum[]>, bounds: BoxBounds, padding = 5) {
    const result: Map<string, PlacedLabel[]> = new Map();

    const sortedDataClone = new Map(
        Array.from(data.entries(), ([k, d]) => [k, d.toSorted((a, b) => b.point.size - a.point.size)])
    );
    const dataValues = [...sortedDataClone.values()].flat();

    // Cell size only affects performance, not correctness: overlapping boxes always share a cell
    // regardless of cell size. Sizing cells to the typical box keeps queries near O(1).
    let dimSum = 0;
    let dimCount = 0;
    for (const d of dataValues) {
        dimSum += d.label.width + d.label.height;
        dimCount += 2;
        if (d.point.size > 0) {
            dimSum += d.point.size;
            dimCount += 1;
        }
    }
    const cellSize = dimCount > 0 ? Math.max(1, dimSum / dimCount) : 1;
    markerIndex.reset(bounds, cellSize);
    placedIndex.reset(bounds, cellSize);

    for (const d of dataValues) {
        const { size } = d.point;
        if (size <= 0) continue;
        let cx = d.point.x;
        let cy = d.point.y;
        if (d.anchor != null) {
            cx -= (d.anchor.x - 0.5) * size;
            cy -= (d.anchor.y - 0.5) * size;
        }
        const r = size / 2;
        markerBox.x = cx - r;
        markerBox.y = cy - r;
        markerBox.width = size;
        markerBox.height = size;
        markerIndex.insert(markerBox, d);
    }

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

            candidateBox.x = x;
            candidateBox.y = y;
            candidateBox.width = width;
            candidateBox.height = height;

            if (
                boxContains(bounds, x, y, width, height) &&
                !markerIndex.query(candidateBox, markerOverlapsCandidate) &&
                !placedIndex.query(candidateBox, placedOverlapsCandidate)
            ) {
                const resultDatum = { index, text, x, y, width, height, datum: d };
                labels.push(resultDatum);
                placedIndex.insert(resultDatum, resultDatum);
            }
        }

        result.set(seriesId, labels);
    }

    return result;
}
