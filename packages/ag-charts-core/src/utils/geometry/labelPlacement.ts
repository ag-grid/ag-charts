import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { Point, SizedPoint } from '../../types/scene';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import { SpatialIndex, gridCellSize } from './spatialIndex';

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
    /**
     * Ordered fallback placements, tried in turn until one fits; the label is dropped if none do.
     * Takes precedence over {@link placement} when present. A single `placement` is equivalent to a
     * one-element list.
     */
    readonly placements?: readonly LabelPlacement[];
    /**
     * Distance from the point to the nearest label edge when a directional placement applies.
     * Defaults to the marker radius. Lets markerless points (size 0) still offset their labels,
     * e.g. above a line vertex that has no marker.
     */
    readonly gap?: number;
}

export interface PlacedLabel<PLD = PointLabelDatum> extends MeasuredLabel, Readonly<Point> {
    readonly index: number;
    readonly datum: PLD;
    /** Which candidate placement was chosen, or `undefined` for the centred (no-offset) position. */
    readonly placement: LabelPlacement | undefined;
}

/**
 * A single obstacle labels must avoid. `box` is the AABB used to prune candidates in the spatial
 * index; the discriminant selects the exact narrow-phase test. `circle` and `rect` are dispatched
 * inline (no allocation on the hot path); `custom` carries its own predicate for shapes the core
 * engine doesn't model (e.g. pie sectors, whose geometry lives in the community package).
 */
export type LabelObstacle =
    | {
          readonly kind: 'circle';
          readonly box: BoxBounds;
          readonly cx: number;
          readonly cy: number;
          readonly r: number;
          readonly sourceId?: string;
          readonly entityIndex?: number;
      }
    | { readonly kind: 'rect'; readonly box: BoxBounds; readonly sourceId?: string; readonly entityIndex?: number }
    | {
          readonly kind: 'custom';
          readonly box: BoxBounds;
          readonly overlaps: (box: BoxBounds) => boolean;
          readonly sourceId?: string;
          readonly entityIndex?: number;
      };

function circleOverlapsBox(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number): boolean {
    if (r <= 0) {
        return false;
    }
    // Closest point on the box to the circle centre, clamped per-axis.
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
    const dx = cx - edgeX;
    const dy = cy - edgeY;
    return Math.hypot(dx, dy) <= r;
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

// Mutable marker obstacle pooled across passes to keep the per-marker hot path allocation-free.
interface PooledCircleObstacle {
    kind: 'circle';
    box: BoxBounds;
    cx: number;
    cy: number;
    r: number;
}

// Scratch state reused across passes (placeLabels is not reentrant in the single-threaded render loop).
const obstacleIndex = new SpatialIndex<LabelObstacle>();
const markerPool: PooledCircleObstacle[] = [];
const candidateBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };

function obstacleOverlapsCandidate(o: LabelObstacle): boolean {
    const { x, y, width, height } = candidateBox;
    switch (o.kind) {
        case 'circle':
            return circleOverlapsBox(o.cx, o.cy, o.r, x, y, width, height);
        case 'rect':
            return boxCollides(o.box, x, y, width, height);
        case 'custom':
            return o.overlaps(candidateBox);
    }
}

/**
 * @param data Points and labels for one or more series. The order of series determines label placement precedence.
 * @param bounds Bounds to fit the labels into. If a label can't be fully contained, it doesn't fit.
 * @param padding
 * @param obstacles External obstacles (e.g. bar rects, pie sectors) every label must avoid, in
 * addition to markers and already-placed labels. All obstacles block all labels, regardless of order.
 * @returns Placed labels for all series.
 */
export function placeLabels(
    data: Map<string, PointLabelDatum[]>,
    bounds: BoxBounds,
    padding = 5,
    obstacles: readonly LabelObstacle[] = []
) {
    const result: Map<string, PlacedLabel[]> = new Map();

    const sortedDataClone = new Map(
        Array.from(data.entries(), ([k, d]) => [k, d.toSorted((a, b) => b.point.size - a.point.size)])
    );
    const dataValues = [...sortedDataClone.values()].flat();

    // updateLabels runs every frame for every chart; with no labels the cell size floors to 1px and
    // resetting the index would walk a per-pixel grid over the whole chart area. Nothing to place.
    if (dataValues.length === 0) return result;

    let extentSum = 0;
    let extentCount = 0;
    for (const d of dataValues) {
        extentSum += d.label.width + d.label.height;
        extentCount += 2;
        if (d.point.size > 0) {
            extentSum += d.point.size;
            extentCount += 1;
        }
    }
    for (const o of obstacles) {
        extentSum += o.box.width + o.box.height;
        extentCount += 2;
    }
    const cellSize = gridCellSize(extentSum, extentCount);
    obstacleIndex.reset(bounds, cellSize);

    for (const o of obstacles) {
        obstacleIndex.insert(o.box, o);
    }

    let markerCount = 0;
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
        let obstacle = markerPool[markerCount];
        if (obstacle == null) {
            obstacle = { kind: 'circle', box: { x: 0, y: 0, width: 0, height: 0 }, cx: 0, cy: 0, r: 0 };
            markerPool.push(obstacle);
        }
        markerCount++;
        obstacle.cx = cx;
        obstacle.cy = cy;
        obstacle.r = r;
        obstacle.box.x = cx - r;
        obstacle.box.y = cy - r;
        obstacle.box.width = size;
        obstacle.box.height = size;
        obstacleIndex.insert(obstacle.box, obstacle);
    }

    for (const [seriesId, datums] of sortedDataClone.entries()) {
        const labels: PlacedLabel[] = [];
        if (!datums[0]?.label) continue;
        for (let index = 0, ln = datums.length; index < ln; index++) {
            const placed = tryPlaceLabel(datums[index], index, padding, bounds);
            if (placed != null) {
                labels.push(placed);
                obstacleIndex.insert(placed, { kind: 'rect', box: placed });
            }
        }

        result.set(seriesId, labels);
    }

    return result;
}

/**
 * Tries each candidate placement for `d` in order and returns the first that fits within `bounds`
 * and clears every obstacle already in the index, or `undefined` if none do. Candidates come from
 * `d.placements` when present, otherwise the single `d.placement` (no allocation in that case).
 */
function tryPlaceLabel(d: PointLabelDatum, index: number, padding: number, bounds: BoxBounds): PlacedLabel | undefined {
    const { point, label, anchor } = d;
    const { text, width, height } = label;
    const r = point.size / 2;
    const candidates = d.placements;
    const candidateCount = candidates?.length ?? 1;

    const gap = d.gap ?? r;
    for (let pi = 0; pi < candidateCount; pi++) {
        const placement = candidates ? candidates[pi] : d.placement;
        let dx = 0;
        let dy = 0;
        if (gap > 0 && placement != null) {
            const vec = labelPlacements[placement];
            dx = (width / 2 + gap + padding) * vec.x;
            dy = (height / 2 + gap + padding) * vec.y;
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

        if (boxContains(bounds, x, y, width, height) && !obstacleIndex.query(candidateBox, obstacleOverlapsCandidate)) {
            return { index, text, x, y, width, height, datum: d, placement };
        }
    }

    return undefined;
}
