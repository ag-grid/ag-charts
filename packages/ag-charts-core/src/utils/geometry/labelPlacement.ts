import type { OverflowStrategy, TextWrap } from 'ag-charts-types';

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

/**
 * How a label's text adapts to the region produced by its placement. `maxWidth`/`maxHeight` bound the
 * region explicitly; when omitted the fit step derives a budget from the series or an estimate.
 */
export interface LabelFit {
    readonly maxWidth?: number;
    readonly maxHeight?: number;
    readonly wrapping?: TextWrap;
    readonly overflowStrategy?: OverflowStrategy;
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
 * Stamp the `avoid` flag and resolved per-category `collideWith` onto label data in place. Series
 * that opt their labels into collision resolution via theme do so per-render here, rather than
 * baking it into each datum at build time. A `collideWith` of `undefined` makes the label avoid
 * every obstacle category, so series with a resolved config must always pass it.
 */
export function applyLabelAvoidance(labelData: readonly object[], avoid: boolean, collideWith?: CollideWith) {
    for (const datum of labelData) {
        const d = datum as { avoid?: boolean; collideWith?: CollideWith };
        d.avoid = avoid;
        d.collideWith = collideWith;
    }
}

/**
 * Stamp the ordered fallback `placements` onto label data in place. Series that resolve their
 * candidate placements from the collision-avoidance model (rather than a single baked-in placement)
 * do so per-render here.
 */
export function applyLabelPlacements(labelData: readonly object[], placements: readonly LabelPlacement[]) {
    for (const datum of labelData) {
        (datum as { placements?: readonly LabelPlacement[] }).placements = placements;
    }
}

export interface PlacedLabel<PLD = PointLabelDatum> extends MeasuredLabel, Readonly<Point> {
    readonly index: number;
    readonly datum: PLD;
    /** Which candidate placement was chosen, or `undefined` for the centred (no-offset) position. */
    readonly placement: LabelPlacement | undefined;
    /** Rotation applied to the label, in degrees, or `undefined` when unrotated. */
    readonly rotation?: number;
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
    // Squared-distance compare avoids Math.hypot's overflow-safe scaling on this per-obstacle hot path.
    return dx * dx + dy * dy <= r * r;
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
// The label's text/box after the fit step, reused per label to keep the hot path allocation-free.
const fittedLabel: { text: NormalisedTextOrSegments; width: number; height: number; rotation: number | undefined } = {
    text: '',
    width: 0,
    height: 0,
    rotation: undefined,
};

function inflateBoxInto(dest: BoxBounds, src: BoxBounds, inflate: number) {
    dest.x = src.x - inflate;
    dest.y = src.y - inflate;
    dest.width = src.width + 2 * inflate;
    dest.height = src.height + 2 * inflate;
}

function obstacleOverlapsCandidate(o: LabelObstacle): boolean {
    const cfg = candidateCollideWith?.[o.category ?? 'seriesItem'];
    if (cfg?.enabled === false) return false;

    inflateBoxInto(inflatedBox, candidateBox, cfg?.minSpacing ?? 0);
    const { x, y, width, height } = inflatedBox;
    switch (o.kind) {
        case 'circle':
            return circleOverlapsBox(o.cx, o.cy, o.r, x, y, width, height);
        case 'rect':
            return boxCollides(o.box, x, y, width, height);
        case 'custom':
            return o.overlaps(inflatedBox);
    }
}

const obstacleCategories = ['marker', 'label', 'seriesItem'] as const;

function maxInflation(collideWith: CollideWith | undefined): number {
    if (collideWith == null) return 0;
    let max = 0;
    for (const key of obstacleCategories) {
        const cfg = collideWith[key];
        if (cfg?.enabled !== false && cfg?.minSpacing != null && cfg.minSpacing > max) {
            max = cfg.minSpacing;
        }
    }
    return max;
}

/** Cell size for the obstacle index, derived from the mean extent of every box it will hold. */
function obstacleGridCellSize(data: Map<string, PointLabelDatum[]>, obstacles: readonly LabelObstacle[]): number {
    let extentSum = 0;
    let extentCount = 0;
    for (const datums of data.values()) {
        for (const d of datums) {
            extentSum += d.label.width + d.label.height;
            extentCount += 2;
            if (d.point.size > 0) {
                extentSum += d.point.size;
                extentCount += 1;
            }
        }
    }
    for (const o of obstacles) {
        extentSum += o.box.width + o.box.height;
        extentCount += 2;
    }
    return gridCellSize(extentSum, extentCount);
}

/** Inserts a pooled circle obstacle for every sized marker into the obstacle index. */
function insertMarkerObstacles(data: Map<string, PointLabelDatum[]>) {
    let markerCount = 0;
    for (const datums of data.values()) {
        for (const d of datums) {
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
    }
}

/** True as soon as any datum opts into collision resolution; short-circuits without a full scan. */
function anyLabelAvoids(data: Map<string, PointLabelDatum[]>): boolean {
    for (const datums of data.values()) {
        for (const d of datums) {
            if (d.avoid) return true;
        }
    }
    return false;
}

/** Resets the shared obstacle index and populates it with external obstacles and marker circles. */
function buildObstacleIndex(
    data: Map<string, PointLabelDatum[]>,
    obstacles: readonly LabelObstacle[],
    bounds: BoxBounds
) {
    obstacleIndex.reset(bounds, obstacleGridCellSize(data, obstacles));
    for (const o of obstacles) {
        obstacleIndex.insert(o.box, o);
    }
    insertMarkerObstacles(data);
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

    // Sorting by size only establishes collision precedence; when no label opts into avoidance every
    // label takes its first placement regardless of order, so skip the per-series clone+sort entirely.
    const avoid = anyLabelAvoids(data);
    const placementData = avoid
        ? new Map(Array.from(data.entries(), ([k, d]) => [k, d.toSorted((a, b) => b.point.size - a.point.size)]))
        : data;

    if (avoid) {
        buildObstacleIndex(placementData, obstacles, bounds);
    }

    for (const [seriesId, datums] of placementData.entries()) {
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

/** Writes the label box top-left for `placement` into `out`, offset from the point by gap+spacing. */
function positionLabelBox(
    out: BoxBounds,
    d: PointLabelDatum,
    width: number,
    height: number,
    gap: number,
    spacing: number,
    placement: LabelPlacement | undefined
) {
    const { point, anchor } = d;
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
    out.x = x;
    out.y = y;
}

/**
 * Fit axis of the two-axis model: adapts the measured label to its region, writing the result into the
 * shared {@link fittedLabel} scratch, and returns that scratch. A pass-through today — text/box are
 * copied unchanged and rotation left unset; the placement axis (below) then tests the box against
 * bounds and obstacles.
 */
function fitLabel(d: PointLabelDatum) {
    const { text, width, height } = d.label;
    fittedLabel.text = text;
    fittedLabel.width = width;
    fittedLabel.height = height;
    fittedLabel.rotation = undefined;
    return fittedLabel;
}

/**
 * Placement axis of the two-axis model: tries each candidate region for `d` in order and returns the
 * first whose fitted label fits within `bounds` and clears every obstacle already in the index, or
 * `undefined` if none do. Candidates come from `d.placements` when present, otherwise the single
 * `d.placement` (no allocation in that case). Labels that opt out of collision resolution (`avoid`
 * falsy) take their first candidate region unconditionally — never bounds-clipped, never dropped,
 * even with no candidates given.
 */
function tryPlaceLabel(d: PointLabelDatum, index: number, padding: number, bounds: BoxBounds): PlacedLabel | undefined {
    const gap = d.gap ?? d.point.size / 2;
    const spacing = d.minSpacing ?? padding;
    const candidates = d.placements;
    const { text, width, height, rotation } = fitLabel(d);

    if (!d.avoid) {
        const placement = candidates ? candidates[0] : d.placement;
        positionLabelBox(candidateBox, d, width, height, gap, spacing, placement);
        return { index, text, x: candidateBox.x, y: candidateBox.y, width, height, datum: d, placement, rotation };
    }

    const inflate = maxInflation(d.collideWith);
    candidateCollideWith = d.collideWith;
    const candidateCount = candidates?.length ?? 1;
    for (let pi = 0; pi < candidateCount; pi++) {
        const placement = candidates ? candidates[pi] : d.placement;
        positionLabelBox(candidateBox, d, width, height, gap, spacing, placement);
        candidateBox.width = width;
        candidateBox.height = height;
        inflateBoxInto(queryBox, candidateBox, inflate);

        const { x, y } = candidateBox;
        if (boxContains(bounds, x, y, width, height) && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
            return { index, text, x, y, width, height, datum: d, placement, rotation };
        }
    }

    return undefined;
}
