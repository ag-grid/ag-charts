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
    /**
     * When falsy (the default) the label takes its first placement unconditionally — bounds and
     * obstacle queries are skipped and it is not inserted as an obstacle, so labels are never moved
     * or dropped. Set true to opt the label into collision resolution.
     */
    readonly avoid?: boolean;
    /**
     * Offset/proximity threshold in px added to the directional placement gap. Falls back to the
     * `padding` argument of {@link placeLabels} when unset.
     */
    readonly minSpacing?: number;
    /** Resolved per-category obstacle configuration. Only consulted when {@link avoid} is true. */
    readonly collideWith?: CollideWith;
}

export type ObstacleCategory = 'marker' | 'label' | 'seriesItem';

export interface CollideWithCategory {
    readonly enabled: boolean;
    /** Extra px the obstacle is inflated by before testing. `undefined` means no inflation. */
    readonly minSpacing?: number;
}

export interface CollideWith {
    readonly marker?: CollideWithCategory;
    readonly label?: CollideWithCategory;
    readonly seriesItem?: CollideWithCategory;
}

/**
 * Stamp the `avoid` flag onto label data in place. Series that opt their labels into collision
 * resolution via theme do so per-render here, rather than baking it into each datum at build time.
 */
export function applyLabelAvoidance(labelData: readonly object[], avoid: boolean) {
    for (const datum of labelData) {
        (datum as { avoid?: boolean }).avoid = avoid;
    }
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
          readonly category?: ObstacleCategory;
          readonly sourceId?: string;
          readonly entityIndex?: number;
      }
    | {
          readonly kind: 'rect';
          readonly box: BoxBounds;
          readonly category?: ObstacleCategory;
          readonly sourceId?: string;
          readonly entityIndex?: number;
      }
    | {
          readonly kind: 'custom';
          readonly box: BoxBounds;
          readonly overlaps: (box: BoxBounds) => boolean;
          readonly category?: ObstacleCategory;
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
    category: ObstacleCategory;
}

// Scratch state reused across passes (placeLabels is not reentrant in the single-threaded render loop).
const obstacleIndex = new SpatialIndex<LabelObstacle>();
const markerPool: PooledCircleObstacle[] = [];
const candidateBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
// Broad-phase query box: the candidate inflated by the largest active per-category minSpacing.
const queryBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
const inflatedBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
// The candidate datum's per-category obstacle config, set before each obstacle query.
let candidateCollideWith: CollideWith | undefined;

function obstacleOverlapsCandidate(o: LabelObstacle): boolean {
    const cfg = candidateCollideWith?.[o.category ?? 'seriesItem'];
    if (cfg?.enabled === false) return false;

    const inflate = cfg?.minSpacing ?? 0;
    const x = candidateBox.x - inflate;
    const y = candidateBox.y - inflate;
    const width = candidateBox.width + 2 * inflate;
    const height = candidateBox.height + 2 * inflate;
    switch (o.kind) {
        case 'circle':
            return circleOverlapsBox(o.cx, o.cy, o.r, x, y, width, height);
        case 'rect':
            return boxCollides(o.box, x, y, width, height);
        case 'custom':
            if (inflate === 0) return o.overlaps(candidateBox);
            inflatedBox.x = x;
            inflatedBox.y = y;
            inflatedBox.width = width;
            inflatedBox.height = height;
            return o.overlaps(inflatedBox);
    }
}

function maxInflation(collideWith: CollideWith | undefined): number {
    if (collideWith == null) return 0;
    let max = 0;
    for (const key of ['marker', 'label', 'seriesItem'] as const) {
        const cfg = collideWith[key];
        if (cfg?.enabled !== false && cfg?.minSpacing != null && cfg.minSpacing > max) {
            max = cfg.minSpacing;
        }
    }
    return max;
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
            obstacle = {
                kind: 'circle',
                box: { x: 0, y: 0, width: 0, height: 0 },
                cx: 0,
                cy: 0,
                r: 0,
                category: 'marker',
            };
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
            const d = datums[index];
            // Series emit a datum per point; unlabelled points measure to an empty box. Skip them so
            // they neither occupy a placement nor act as obstacles against labels that do have text.
            if (d.label.text === '') continue;
            const placed = tryPlaceLabel(d, index, padding, bounds);
            if (placed != null) {
                labels.push(placed);
                // Labels that opt out of collision resolution neither query obstacles nor block
                // other labels, so they are not inserted into the index.
                if (d.avoid) {
                    obstacleIndex.insert(placed, { kind: 'rect', box: placed, category: 'label' });
                }
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
    const spacing = d.minSpacing ?? padding;
    const inflate = d.avoid ? maxInflation(d.collideWith) : 0;
    candidateCollideWith = d.collideWith;
    for (let pi = 0; pi < candidateCount; pi++) {
        const placement = candidates ? candidates[pi] : d.placement;
        let dx = 0;
        let dy = 0;
        if (gap > 0 && placement != null) {
            const vec = labelPlacements[placement];
            dx = (width / 2 + gap + spacing) * vec.x;
            dy = (height / 2 + gap + spacing) * vec.y;
        }

        let x = point.x - width / 2 + dx;
        let y = point.y - height / 2 + dy;
        if (anchor) {
            x -= (anchor.x - 0.5) * point.size;
            y -= (anchor.y - 0.5) * point.size;
        }

        // Labels that opt out of collision resolution take their first placement unconditionally:
        // never bounds-clipped, never dropped.
        if (!d.avoid) {
            return { index, text, x, y, width, height, datum: d, placement };
        }

        candidateBox.x = x;
        candidateBox.y = y;
        candidateBox.width = width;
        candidateBox.height = height;
        queryBox.x = x - inflate;
        queryBox.y = y - inflate;
        queryBox.width = width + 2 * inflate;
        queryBox.height = height + 2 * inflate;

        if (boxContains(bounds, x, y, width, height) && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
            return { index, text, x, y, width, height, datum: d, placement };
        }
    }

    return undefined;
}
