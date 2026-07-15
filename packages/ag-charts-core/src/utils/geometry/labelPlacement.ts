import type { AgChartLabelOrientation, OverflowStrategy, PaddingOptions, TextWrap } from 'ag-charts-types';

import { cachedTextMeasurer, measureTextSegments } from '../../rendering/textMeasurer';
import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { Point, SizedPoint } from '../../types/scene';
import type { FontOptions } from '../../types/text';
import { toArray } from '../data/arrays';
import { isArray } from '../types/typeGuards';
import { toRadians } from './angle';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import { getMinOuterRectSize } from './math/shapeUtils';
import { SpatialIndex, gridCellSize } from './spatialIndex';

export type LabelPlacement =
    | 'inside'
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
 * The label-surface fit fields as authored on a series label. `truncate` is the public ellipsis-vs-hide
 * policy; {@link resolveLabelFit} maps it onto the engine's internal {@link LabelFit.overflowStrategy}.
 */
export interface LabelFitOptions {
    readonly maxWidth?: number;
    readonly maxHeight?: number;
    readonly wrapping?: TextWrap;
    readonly truncate?: boolean;
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

/**
 * Resolves the label-surface fit fields to an engine {@link LabelFit}, mapping the public `truncate`
 * boolean onto the internal overflow strategy:
 *  - `truncate: true` or `defaultToTruncate` → `'ellipsis'`: the bound is applied and overflow truncates with an ellipsis.
 *  - `truncate` unset + `avoidCollisions` → `'hide'`: the bound is applied and the label hides if it overflows.
 *  - `truncate` unset + no collision avoidance → `undefined`: no bound is applied and the full text
 *    renders, leaving charts that opt into neither truncation nor collision avoidance unchanged.
 *
 * @param defaultToTruncate When `truncate` is unset, ellipsise on overflow rather than hide. Used by
 * inside-marker labels, which are bound to the marker box and must never vanish when the text overruns it.
 */
export function resolveLabelFit(
    fit: LabelFitOptions,
    avoidCollisions = false,
    defaultToTruncate = false
): LabelFit | undefined {
    let overflowStrategy: OverflowStrategy | undefined;
    if (fit.truncate || defaultToTruncate) {
        overflowStrategy = 'ellipsis';
    } else if (avoidCollisions) {
        overflowStrategy = 'hide';
    } else {
        return undefined;
    }
    const { maxWidth, maxHeight, wrapping } = fit;
    return { maxWidth, maxHeight, wrapping, overflowStrategy };
}

/**
 * A pre-positioned label candidate the engine cascades over without computing any geometry itself.
 * The series that produced it owns the placement maths (bar-family labels use rect-relative geometry
 * the compass-vector engine can't express); the engine only runs generic containment, obstacle, flush
 * and least-overflow logic over the opaque list. `box` is in absolute plot coordinates and already
 * carries the rotated footprint, matching {@link PlacedLabel}'s top-left/`width`/`height` convention.
 */
export interface PositionedLabelCandidate {
    /** Absolute plot coordinates: top-left of the rotated footprint, with `width`/`height` the footprint size. */
    readonly box: BoxBounds;
    /** Per-candidate containment rect; falls back to the shared `bounds` when unset. */
    readonly region?: BoxBounds;
    /** Render rotation in degrees (engine convention, matching {@link PlacedLabel.rotation}); `0`/unset is upright. */
    readonly rotation?: number;
}

export interface PointLabelDatum {
    readonly point: Readonly<SizedPoint>;
    readonly label: MeasuredLabel;
    readonly anchor: Point | undefined;
    /**
     * Shifts an `inside` label off the marker centre by this fraction of the marker diameter (x, y
     * down), so the label sits at the largest rectangle within a non-centred shape. Applied only for
     * the `inside` placement, leaving directional placements unaffected.
     */
    readonly insideOffset?: Readonly<Point>;
    readonly placement: LabelPlacement | undefined;
    /**
     * Ordered fallback placements, tried in turn until one fits; the label is dropped if none do.
     * Takes precedence over {@link placement} when present. A single `placement` is equivalent to a
     * one-element list. Overrides the series {@link SeriesLabelDefaults.placements} when set.
     */
    readonly placements?: readonly LabelPlacement[];
    /**
     * Orientation candidate(s), tried per placement until one fits; falls back to no rotation. A
     * single value is equivalent to a one-element list. The engine maps each orientation to the
     * rotation angle it renders at ({@link PlacedLabel.rotation}).
     */
    readonly orientation?: AgChartLabelOrientation | AgChartLabelOrientation[];
    /**
     * Distance from the point to the nearest label edge when a directional placement applies.
     * Defaults to the marker radius. Lets markerless points (size 0) still offset their labels,
     * e.g. above a line vertex that has no marker.
     */
    readonly gap?: number;
    /**
     * When falsy (the default) the label takes its first placement unconditionally — bounds and
     * obstacle queries are skipped, so it is never moved or dropped. It is still registered as an
     * obstacle whenever the index is active (some other series avoids), so avoiding series steer
     * clear of it. Set true to opt the label into collision resolution. Overrides the series
     * {@link SeriesLabelDefaults.avoid} when set.
     */
    readonly avoid?: boolean;
    /**
     * Offset/proximity threshold in px added to the directional placement gap. Overrides the series
     * {@link SeriesLabelDefaults.minSpacing} when set, else falls back to the `padding` argument of
     * {@link placeLabels}.
     */
    readonly minSpacing?: number;
    /**
     * Resolved per-category obstacle configuration. Only consulted when {@link avoid} is true.
     * Overrides the series {@link SeriesLabelDefaults.collideWith} when set.
     */
    readonly collideWith?: CollideWith;
    /**
     * Containment rect for this label's fit test, overriding the shared `bounds`. Bar-family labels
     * constrain to their own bar rect so a candidate that overflows the bar is rejected. Falls back
     * to `bounds` when unset, so existing point-series consumers are unaffected.
     */
    readonly region?: BoxBounds;
    /**
     * The label is always rendered, so it must never be dropped: when no candidate fits its region or
     * clears every obstacle, the least region-overflowing candidate is kept instead. Bar-family labels
     * set this because the engine only chooses their orientation — dropping one would revert it to the
     * baked first orientation and overflow the bar. Droppable point labels leave it unset.
     */
    readonly neverDrop?: boolean;
    /**
     * Authoritative pre-positioned candidates, tried in order; each carries its own region. When
     * present the engine cascades over these opaque boxes and never computes a placement itself
     * (skipping {@link positionLabelBox} and the `placement`/`orientation` candidate loops). Used by
     * bar-family labels, whose rect-relative candidates the compass-vector engine can't express.
     */
    readonly positionedCandidates?: readonly PositionedLabelCandidate[];
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
 * Series-level collision defaults shared by every label in a series, resolved once per render from
 * the series' collision-avoidance config. A datum's own field ({@link PointLabelDatum.avoid} etc.)
 * overrides the matching default; when unset the engine falls back to these.
 */
export interface SeriesLabelDefaults {
    readonly avoid?: boolean;
    readonly minSpacing?: number;
    readonly collideWith?: CollideWith;
    readonly placements?: readonly LabelPlacement[];
}

/** Per-series label placement input: the datums plus the series-level collision defaults. */
export interface SeriesLabels {
    readonly datums: readonly PointLabelDatum[];
    readonly defaults?: SeriesLabelDefaults;
}

/** Structural source of a series' resolved collision config (community `LabelCollisionAvoidance`). */
export interface CollisionAvoidanceSource {
    readonly avoid: boolean;
    readonly minSpacing?: number;
    resolveCollideWith(): CollideWith | undefined;
}

/** Resolves a series' collision-avoidance config into the shared {@link SeriesLabelDefaults}. */
export function resolveSeriesLabelDefaults(
    src: CollisionAvoidanceSource,
    placements?: readonly LabelPlacement[]
): SeriesLabelDefaults {
    return { avoid: src.avoid, minSpacing: src.minSpacing, collideWith: src.resolveCollideWith(), placements };
}

export interface PlacedLabel<PLD = PointLabelDatum> extends MeasuredLabel, Readonly<Point> {
    readonly index: number;
    readonly datum: PLD;
    /** Which candidate placement was chosen, or `undefined` for the centred (no-offset) position. */
    readonly placement: LabelPlacement | undefined;
    /** Rotation applied to the label, in degrees, or `undefined` when unrotated. */
    readonly rotation?: number;
    /** Translation (px) applied to slide a region-bound label flush inside its region; `0` otherwise. */
    readonly offsetX?: number;
    readonly offsetY?: number;
    /**
     * The chosen entry when the datum supplied {@link PointLabelDatum.positionedCandidates}. Carries
     * the series' own writeback metadata (a bar candidate's anchor and granular placement); `placement`
     * stays `undefined` on this path since the candidate box, not a compass placement, was resolved.
     */
    readonly candidate?: PositionedLabelCandidate;
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

// Rotation angle (degrees) each orientation renders at, relative to a horizontal baseline:
// `horizontal` reads upright, the two `vertical` variants a quarter-turn in either direction.
export const orientationAngles: Record<AgChartLabelOrientation, number> = {
    horizontal: 0,
    vertical: -90,
    'vertical-reversed': 90,
};

/**
 * Rotation (radians) for a bar-family label from its `orientation`; `0` when the orientation is
 * unset, so an unrotated label renders exactly as before.
 */
export function barLabelRotation(orientation: AgChartLabelOrientation | undefined): number {
    return orientation == null ? 0 : toRadians(orientationAngles[orientation]);
}

/** Recovers a bar label's `orientation` from its render rotation (radians); inverse of {@link barLabelRotation}. */
export function barLabelOrientation(rotation: number): AgChartLabelOrientation {
    if (rotation < 0) return 'vertical';
    if (rotation > 0) return 'vertical-reversed';
    return 'horizontal';
}

const oppositeSide: Record<keyof Required<PaddingOptions>, keyof Required<PaddingOptions>> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
};

/**
 * Distance from a bar label's anchor to the bar-facing edge of its (rotated) background box — the gap
 * the placement must leave, beyond `spacing`, so the box clears the bar.
 *
 * The node renders the padded box then rotates it about its own centre. So the reach is the box's
 * half-extent along the facing axis after rotation, corrected for the anchor sitting on the glyph
 * edge (not the box centre) and for asymmetric padding shifting the box centre off the glyph centre.
 * At `rotation === 0` this reduces exactly to `padding[facing]`, leaving unrotated labels unchanged;
 * a `vertical` label (±90°) instead reaches by the box's cross-axis half-extent.
 */
export function rotatedLabelInset(
    facing: keyof Required<PaddingOptions>,
    rotation: number,
    labelWidth: number,
    labelHeight: number,
    padding: Required<PaddingOptions>
): number {
    const vertical = facing === 'top' || facing === 'bottom';
    if (rotation === 0) return padding[facing];
    const boxWidth = labelWidth + padding.left + padding.right;
    const boxHeight = labelHeight + padding.top + padding.bottom;
    const sin = Math.abs(Math.sin(rotation));
    const cos = Math.abs(Math.cos(rotation));
    const halfExtent = vertical
        ? (boxWidth / 2) * sin + (boxHeight / 2) * cos
        : (boxWidth / 2) * cos + (boxHeight / 2) * sin;
    const glyphHalf = vertical ? labelHeight / 2 : labelWidth / 2;
    return halfExtent - glyphHalf + (padding[facing] - padding[oppositeSide[facing]]) / 2;
}

/**
 * How far a rotated label's glyph centre drifts from where the anchor placed it. The node rotates the
 * padded box about its own centre, and asymmetric padding offsets that centre from the glyph centre by
 * `shift = ((right − left)/2, (bottom − top)/2)`; the glyph therefore lands at `glyph + (I − R(θ))·shift`.
 * Subtract this from the anchor to keep the glyph centred where the caller intended. Zero when
 * unrotated or when padding is symmetric on the rotating axis.
 */
export function rotatedGlyphDrift(rotation: number, padding: Required<PaddingOptions>): Point {
    const sx = (padding.right - padding.left) / 2;
    const sy = (padding.bottom - padding.top) / 2;
    const sin = Math.sin(rotation);
    const cos = Math.cos(rotation);
    return { x: sx * (1 - cos) + sy * sin, y: sy * (1 - cos) - sx * sin };
}

export interface OrientationAnchor {
    readonly x: number;
    readonly y: number;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
}

/**
 * A bar-family label routed through {@link placeLabels} to resolve an ordered `orientation` array.
 * `target` back-references the baked label datum the chosen rotation is written onto.
 */
export interface BarPlacedLabelDatum extends PointLabelDatum {
    readonly target: BarLabelTarget;
}

/** The baked label datum an orientation resolution writes its chosen rotation and flush offset back onto. */
export interface BarLabelTarget {
    rotation: number;
    offsetX?: number;
    offsetY?: number;
    // Positioned-candidate writeback (placement-cascade path only): the chosen candidate's anchor and
    // granular placement, copied here so the label renders at the winning candidate rather than the
    // baked first one. Left untouched on the orientation-only path.
    x?: number;
    y?: number;
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
    placement?: string;
}

/**
 * The bar-specific metadata a {@link PositionedLabelCandidate} carries when it comes from a bar-family
 * label: the render anchor and granular placement written back onto the label node when the candidate
 * wins. Kept string-typed for `placement` so core does not depend on the community `BarLabelPlacement`.
 */
interface BarPositionedCandidate extends PositionedLabelCandidate {
    readonly anchor: OrientationAnchor;
    readonly placement: string;
}

// Bar labels sit inside their own bar rect, so avoid other labels only — not markers, and not the
// bar rects themselves (a bar label would otherwise always collide with its own `seriesItem` box).
const barLabelCollideWith: CollideWith = {
    label: { enabled: true },
    marker: { enabled: false },
    seriesItem: { enabled: false },
};

/**
 * True when an `orientation` array offers more than one candidate to fall through. A single value
 * (or unset) has nothing to resolve, so the series keeps its unconditional first-orientation bake
 * and never enters the placement engine — leaving existing charts byte-identical.
 */
export function barLabelResolvesOrientation(
    orientation: AgChartLabelOrientation | AgChartLabelOrientation[] | undefined
): boolean {
    return Array.isArray(orientation) && orientation.length > 1;
}

/**
 * Centre of the unrotated glyph box for a label at `anchor`. The renderer pivots rotation about this
 * centre, so it is orientation-invariant and seeds the engine's centred candidate box.
 */
export function labelGlyphCentre(anchor: OrientationAnchor, width: number, height: number): Point {
    let { x, y } = anchor;
    if (anchor.textAlign === 'left' || anchor.textAlign === 'start') {
        x += width / 2;
    } else if (anchor.textAlign === 'right' || anchor.textAlign === 'end') {
        x -= width / 2;
    }
    if (anchor.textBaseline === 'top') {
        y += height / 2;
    } else if (anchor.textBaseline === 'bottom') {
        y -= height / 2;
    }
    return { x, y };
}

/**
 * Builds the {@link PointLabelDatum} routing a bar label through the placement engine: centred on its
 * glyph box, constrained to `region` (its bar rect, or `undefined` for the plot bounds), avoiding
 * other labels, offering the `orientations` candidates.
 */
export function buildBarLabelDatum(
    anchor: OrientationAnchor,
    text: NormalisedTextOrSegments,
    width: number,
    height: number,
    orientations: AgChartLabelOrientation[],
    region: BoxBounds | undefined,
    target: BarLabelTarget
): BarPlacedLabelDatum {
    const { x, y } = labelGlyphCentre(anchor, width, height);
    return {
        point: { x, y, size: 0 },
        label: { text, width, height },
        anchor: undefined,
        placement: undefined,
        orientation: orientations,
        gap: 0,
        avoid: true,
        neverDrop: true,
        collideWith: barLabelCollideWith,
        region,
        target,
    };
}

/**
 * Builds the {@link PointLabelDatum} routing a bar label through the positioned-candidate engine path:
 * the pre-positioned `candidates` are cascaded in order (each carries its own region), avoiding other
 * labels, never dropped. Mirrors {@link buildBarLabelDatum}'s avoid/neverDrop/collideWith but hands the
 * engine opaque boxes instead of an orientation array to resolve.
 */
export function buildBarPositionedLabelDatum(
    text: NormalisedTextOrSegments,
    width: number,
    height: number,
    candidates: readonly PositionedLabelCandidate[],
    target: BarLabelTarget
): BarPlacedLabelDatum {
    return {
        point: { x: 0, y: 0, size: 0 },
        label: { text, width, height },
        anchor: undefined,
        placement: undefined,
        gap: 0,
        avoid: true,
        neverDrop: true,
        collideWith: barLabelCollideWith,
        positionedCandidates: candidates,
        target,
    };
}

/**
 * Writes each placed label's chosen orientation back as a render rotation (radians), plus the flush
 * offset that slid it inside its region, onto its target. Labels the engine dropped are absent here
 * and keep the first-orientation rotation baked at node-data time. Every datum here was produced by
 * {@link buildBarLabelDatum}, so it carries `target`.
 */
export function applyBarLabelOrientation(placed: readonly PlacedLabel<unknown>[]): void {
    for (const { datum, rotation, offsetX, offsetY, candidate } of placed) {
        const { target } = datum as BarPlacedLabelDatum;
        target.rotation = toRadians(rotation ?? 0);
        target.offsetX = offsetX ?? 0;
        target.offsetY = offsetY ?? 0;
        // Placement-cascade path: the engine chose a whole candidate (region + rotation may differ per
        // candidate), so also retarget the label to that candidate's anchor and granular placement. The
        // orientation-only path leaves `candidate` unset and keeps the baked anchor/placement.
        if (candidate != null) {
            const { anchor, placement } = candidate as BarPositionedCandidate;
            target.x = anchor.x;
            target.y = anchor.y;
            target.textAlign = anchor.textAlign;
            target.textBaseline = anchor.textBaseline;
            target.placement = placement;
        }
    }
}

/**
 * True when a `placement` array offers more than one candidate to cascade through. A single value (or
 * unset) has nothing to resolve, so the series keeps its unconditional first-placement bake and never
 * enters the positioned-candidate engine path — leaving existing charts byte-identical.
 */
export function barLabelResolvesPlacement(placement: unknown): boolean {
    return Array.isArray(placement) && placement.length > 1;
}

/** Measured size of a label's text or rich-text segments under the given font. */
export function measureLabelText(text: NormalisedTextOrSegments, font: FontOptions): { width: number; height: number } {
    return isArray(text) ? measureTextSegments(text, font) : cachedTextMeasurer(font).measureLines(String(text));
}

/** A baked bar-family label paired with the label config that governs its orientation and font. */
export interface BarLabelSource {
    readonly label:
        | (OrientationAnchor & { text: NormalisedTextOrSegments; region?: BoxBounds } & BarLabelTarget)
        | undefined;
    readonly config: FontOptions & { orientation?: AgChartLabelOrientation | AgChartLabelOrientation[] };
}

/**
 * Builds the placement-engine data for a series' baked labels: for each element `resolve` yields the
 * label object and its config; single-orientation labels are skipped (nothing to resolve).
 */
export function buildBarLabelData<T>(
    elements: Iterable<T> | undefined,
    resolve: (element: T) => BarLabelSource | undefined
): BarPlacedLabelDatum[] {
    const data: BarPlacedLabelDatum[] = [];
    for (const element of elements ?? []) {
        const source = resolve(element);
        if (source?.label == null || source.label.text === '') continue;
        const { label, config } = source;
        const orientations = toArray(config.orientation);
        if (orientations.length <= 1) continue;
        const { width, height } = measureLabelText(label.text, config);
        data.push(buildBarLabelDatum(label, label.text, width, height, orientations, label.region, label));
    }
    return data;
}

const labelPlacements: Record<LabelPlacement, { x: -1 | 0 | 1; y: -1 | 0 | 1 }> = {
    inside: { x: 0, y: 0 },
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
// The placement of the candidate being tested; an `inside` candidate ignores its own marker obstacle
// because it is centred on that marker by design (and would otherwise always collide with it), while
// still avoiding every other marker.
let candidatePlacement: LabelPlacement | undefined;
// Centre of the candidate datum's own marker, matched against marker obstacles so an `inside` candidate
// skips only that one. Set per datum before its obstacle queries.
let candidateOwnMarkerCx = 0;
let candidateOwnMarkerCy = 0;
// The label's text/box after the fit step, reused per label to keep the hot path allocation-free.
const fittedLabel: { text: NormalisedTextOrSegments; width: number; height: number } = {
    text: '',
    width: 0,
    height: 0,
};
// Rotated axis-aligned footprint, written per candidate to keep the rotation loop allocation-free.
const rotatedSize = { width: 0, height: 0 };

// Writes the axis-aligned footprint of a `w`×`h` label rotated `rotationDeg` into the shared
// `rotatedSize` scratch (allocation-free variant of getMinOuterRectSize for the candidate hot loop).
// Short-circuits the unrotated case so the common path pays no trig.
function rotatedSizeInto(rotationDeg: number, w: number, h: number) {
    if (rotationDeg === 0) {
        rotatedSize.width = w;
        rotatedSize.height = h;
        return;
    }
    const angle = (rotationDeg % 180) * (Math.PI / 180);
    const sin = Math.abs(Math.sin(angle));
    const cos = Math.abs(Math.cos(angle));
    rotatedSize.width = w * cos + h * sin;
    rotatedSize.height = w * sin + h * cos;
}

function inflateBoxInto(dest: BoxBounds, src: BoxBounds, inflate: number) {
    dest.x = src.x - inflate;
    dest.y = src.y - inflate;
    dest.width = src.width + 2 * inflate;
    dest.height = src.height + 2 * inflate;
}

function obstacleOverlapsCandidate(o: LabelObstacle): boolean {
    const category = o.category ?? 'seriesItem';
    if (
        candidatePlacement === 'inside' &&
        category === 'marker' &&
        o.kind === 'circle' &&
        o.cx === candidateOwnMarkerCx &&
        o.cy === candidateOwnMarkerCy
    ) {
        return false;
    }
    const cfg = candidateCollideWith?.[category];
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
function obstacleGridCellSize(data: Map<string, SeriesLabels>, obstacles: readonly LabelObstacle[]): number {
    let extentSum = 0;
    let extentCount = 0;
    for (const { datums } of data.values()) {
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

// Anchor-adjusted marker centre, written into the shared scratch (allocation-free). Marker-obstacle
// creation and the `inside` own-marker match both read it, so they cannot drift out of sync.
const markerCentre = { cx: 0, cy: 0 };
function markerCentreOf(d: PointLabelDatum) {
    const { x, y, size } = d.point;
    markerCentre.cx = x;
    markerCentre.cy = y;
    if (d.anchor != null) {
        markerCentre.cx -= (d.anchor.x - 0.5) * size;
        markerCentre.cy -= (d.anchor.y - 0.5) * size;
    }
}

/** Inserts a pooled circle obstacle for every sized marker into the obstacle index. */
function insertMarkerObstacles(data: Map<string, SeriesLabels>) {
    let markerCount = 0;
    for (const { datums } of data.values()) {
        for (const d of datums) {
            const { size } = d.point;
            if (size <= 0) continue;
            markerCentreOf(d);
            const { cx, cy } = markerCentre;
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

/** True as soon as any series opts into collision resolution; short-circuits without a full scan. */
function anyLabelAvoids(data: Map<string, SeriesLabels>): boolean {
    for (const entry of data.values()) {
        if (seriesAvoids(entry)) return true;
    }
    return false;
}

/**
 * True if the series opts into collision resolution. Point-series carry `avoid` in their series
 * {@link SeriesLabels.defaults}; bar-family stamps it per datum, where the first datum is
 * authoritative (uniform across the series). Used for cross-series ordering only, never correctness.
 */
function seriesAvoids(entry: SeriesLabels): boolean {
    return (entry.defaults?.avoid ?? entry.datums[0]?.avoid) === true;
}

/** Series entries with all non-avoiding series first (stable), then avoiding ones. */
function orderNonAvoidingFirst(data: Map<string, SeriesLabels>): [string, SeriesLabels][] {
    const entries = Array.from(data.entries());
    return [...entries.filter(([, e]) => !seriesAvoids(e)), ...entries.filter(([, e]) => seriesAvoids(e))];
}

/** Resets the shared obstacle index and populates it with external obstacles and marker circles. */
function buildObstacleIndex(data: Map<string, SeriesLabels>, obstacles: readonly LabelObstacle[], bounds: BoxBounds) {
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
    data: Map<string, SeriesLabels>,
    bounds: BoxBounds,
    padding = 5,
    obstacles: readonly LabelObstacle[] = []
) {
    const result: Map<string, PlacedLabel[]> = new Map();

    // Sorting by size only establishes collision precedence; when no label opts into avoidance every
    // label takes its first placement regardless of order, so skip the per-series clone+sort entirely.
    const avoid = anyLabelAvoids(data);
    const placementData = avoid
        ? new Map(
              Array.from(data.entries(), ([k, entry]) => [
                  k,
                  { datums: entry.datums.toSorted((a, b) => b.point.size - a.point.size), defaults: entry.defaults },
              ])
          )
        : data;

    if (avoid) {
        buildObstacleIndex(placementData, obstacles, bounds);
    }

    // Place non-avoiding series first so their fixed boxes are in the index before any avoiding
    // series resolves against them. With no avoidance the index is never built, so order is moot.
    const entries = avoid ? orderNonAvoidingFirst(placementData) : placementData.entries();

    for (const [seriesId, { datums, defaults }] of entries) {
        const labels: PlacedLabel[] = [];
        if (!datums[0]?.label) continue;
        for (let index = 0, ln = datums.length; index < ln; index++) {
            const d = datums[index];
            // Series emit a datum per point; unlabelled points measure to an empty box. Skip them so
            // they neither occupy a placement nor act as obstacles against labels that do have text.
            if (d.label.text === '') continue;
            const placed = tryPlaceLabel(d, defaults, index, padding, bounds);
            if (placed != null) {
                labels.push(placed);
                // Every placed label is a fixed obstacle for avoiding series, whether or not it
                // avoids others itself; register it whenever the index is active.
                if (avoid) {
                    const box = labelObstacleBox(placed);
                    obstacleIndex.insert(box, { kind: 'rect', box, category: 'label' });
                }
            }
        }

        result.set(seriesId, labels);
    }

    return result;
}

/**
 * The box a placed label occupies as an obstacle. Unrotated labels return their own box unchanged
 * (the common path, zero-allocation); rotated labels return their outer axis-aligned footprint so
 * later labels avoid the true rotated extent, not the narrower measured box.
 */
function labelObstacleBox(placed: PlacedLabel): BoxBounds {
    if (placed.rotation == null) return placed;
    const { width, height } = getMinOuterRectSize(placed.rotation, placed.width, placed.height);
    return { x: placed.x, y: placed.y, width, height };
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
    if (placement === 'inside' && d.insideOffset) {
        x += d.insideOffset.x * point.size;
        y += d.insideOffset.y * point.size;
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
    return fittedLabel;
}

/**
 * Placement axis of the two-axis model: tries each candidate region for `d` in order — and, within
 * each, each candidate rotation — and returns the first whose fitted label fits within `bounds` and
 * clears every obstacle already in the index, or `undefined` if none do. Candidate placements resolve
 * from `d.placements`, then the series `defaults.placements`, then the single `d.placement`; orientation
 * from `d.orientation`. The reported box keeps the label's measured `width`/`height`; the rotated
 * footprint is used only for containment and obstacle tests. Labels that opt out of collision
 * resolution (`avoid` falsy) take their first candidate region unconditionally — never bounds-clipped,
 * never dropped, even with no candidates given.
 */
function tryPlaceLabel(
    d: PointLabelDatum,
    defaults: SeriesLabelDefaults | undefined,
    index: number,
    padding: number,
    bounds: BoxBounds
): PlacedLabel | undefined {
    // A datum's own field overrides the series default; when neither is set the built-in applies.
    const avoid = d.avoid ?? defaults?.avoid ?? false;
    const placements = d.placements ?? defaults?.placements;
    const collideWith = d.collideWith ?? defaults?.collideWith;
    const gap = d.gap ?? d.point.size / 2;
    const spacing = d.minSpacing ?? defaults?.minSpacing ?? padding;
    const { text, width, height } = fitLabel(d);

    if (!avoid) {
        const placement = candidateAt(placements, d.placement, 0);
        const orientation = candidateAt(orientationsOf(d), singleOrientationOf(d), 0);
        const rotation = positionCandidate(d, placement, orientation, width, height, gap, spacing);
        const { x, y } = candidateBox;
        return { index, text, x, y, width, height, datum: d, placement, rotation: rotation || undefined };
    }

    return placeAvoidingLabel(d, placements, collideWith, index, bounds, text, width, height, gap, spacing);
}

/**
 * Tries each `(placement × orientation)` candidate for an avoidance label, returning the first whose
 * rotated box fits `d.region ?? bounds` and clears every obstacle. When none fits: a {@link
 * PointLabelDatum.neverDrop} label keeps the least region-overflowing candidate (it is always
 * rendered, so dropping it would revert its orientation to the baked first one), otherwise it is
 * dropped (`undefined`).
 */
function placeAvoidingLabel(
    d: PointLabelDatum,
    placements: readonly LabelPlacement[] | undefined,
    collideWith: CollideWith | undefined,
    index: number,
    bounds: BoxBounds,
    text: NormalisedTextOrSegments,
    width: number,
    height: number,
    gap: number,
    spacing: number
): PlacedLabel | undefined {
    if (d.positionedCandidates != null) {
        return placeFromPositionedCandidates(d, collideWith, index, bounds, text, width, height);
    }
    const candidates = placements;
    const orientations = orientationsOf(d);
    const singleOrientation = singleOrientationOf(d);
    const inflate = maxInflation(collideWith);
    candidateCollideWith = collideWith;
    markerCentreOf(d);
    candidateOwnMarkerCx = markerCentre.cx;
    candidateOwnMarkerCy = markerCentre.cy;
    const candidateCount = candidates?.length ?? 1;
    const orientationCount = orientations?.length ?? 1;
    const region = d.region ?? bounds;
    // Edge-anchored bar labels are centred on their glyph centre, which for inside-start/inside-end
    // sits at the bar's end; a candidate rotated to run along the bar would straddle that end. Slide
    // it flush inside its own bar rect instead (a no-op for inside-center, already centred).
    const flushToRegion = d.region != null && d.neverDrop;

    let bestOverflow = Infinity;
    let bestX = 0;
    let bestY = 0;
    let bestRotation = 0;
    let bestOffsetX = 0;
    let bestOffsetY = 0;
    let bestPlacement: LabelPlacement | undefined;

    for (let pi = 0; pi < candidateCount; pi++) {
        const placement = candidateAt(candidates, d.placement, pi);
        for (let oi = 0; oi < orientationCount; oi++) {
            const orientation = candidateAt(orientations, singleOrientation, oi);
            const rotation = positionCandidate(d, placement, orientation, width, height, gap, spacing);
            let { x, y } = candidateBox;
            const { width: cw, height: ch } = candidateBox;
            let offsetX = 0;
            let offsetY = 0;
            if (flushToRegion) {
                const nx = clampAxis(x, cw, region.x, region.width);
                const ny = clampAxis(y, ch, region.y, region.height);
                offsetX = nx - x;
                offsetY = ny - y;
                candidateBox.x = x = nx;
                candidateBox.y = y = ny;
            }
            candidatePlacement = placement;
            inflateBoxInto(queryBox, candidateBox, inflate);
            if (boxContains(region, x, y, cw, ch) && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
                return {
                    index,
                    text,
                    x,
                    y,
                    width,
                    height,
                    datum: d,
                    placement,
                    rotation: rotation || undefined,
                    offsetX,
                    offsetY,
                };
            }
            const overflow = d.neverDrop ? regionOverflow(region, x, y, cw, ch) : Infinity;
            if (overflow < bestOverflow) {
                bestOverflow = overflow;
                bestX = x;
                bestY = y;
                bestRotation = rotation;
                bestOffsetX = offsetX;
                bestOffsetY = offsetY;
                bestPlacement = placement;
            }
        }
    }

    if (bestOverflow === Infinity) return undefined;
    return {
        index,
        text,
        x: bestX,
        y: bestY,
        width,
        height,
        datum: d,
        placement: bestPlacement,
        rotation: bestRotation || undefined,
        offsetX: bestOffsetX,
        offsetY: bestOffsetY,
    };
}

/**
 * Cascades over {@link PointLabelDatum.positionedCandidates} in order, returning the first candidate
 * whose box fits its own `region` (or the shared `bounds`) and clears every obstacle. Runs only the
 * generic containment/obstacle/flush/least-overflow logic — the series pre-computed each candidate's
 * geometry, so no placement maths happens here. When none fits, a {@link PointLabelDatum.neverDrop}
 * datum keeps the least region-overflowing candidate; otherwise it is dropped (`undefined`).
 */
function placeFromPositionedCandidates(
    d: PointLabelDatum,
    collideWith: CollideWith | undefined,
    index: number,
    bounds: BoxBounds,
    text: NormalisedTextOrSegments,
    width: number,
    height: number
): PlacedLabel | undefined {
    const candidates = d.positionedCandidates!;
    const inflate = maxInflation(collideWith);
    candidateCollideWith = collideWith;
    // No compass placement and no own marker on this path: bars disable marker collisions, so the
    // `inside` own-marker skip in obstacleOverlapsCandidate must stay inert.
    candidatePlacement = undefined;

    let bestOverflow = Infinity;
    let bestX = 0;
    let bestY = 0;
    let bestOffsetX = 0;
    let bestOffsetY = 0;
    let bestCandidate: PositionedLabelCandidate | undefined;

    for (let ci = 0, ln = candidates.length; ci < ln; ci++) {
        const c = candidates[ci];
        const region = c.region ?? bounds;
        candidateBox.x = c.box.x;
        candidateBox.y = c.box.y;
        candidateBox.width = c.box.width;
        candidateBox.height = c.box.height;
        let { x, y } = candidateBox;
        const { width: cw, height: ch } = candidateBox;
        let offsetX = 0;
        let offsetY = 0;
        // Slide a region-bound candidate flush inside its own region (matches the orientation path's
        // clampAxis flush); a region-less (outside) candidate floats.
        if (c.region != null && d.neverDrop) {
            const nx = clampAxis(x, cw, region.x, region.width);
            const ny = clampAxis(y, ch, region.y, region.height);
            offsetX = nx - x;
            offsetY = ny - y;
            candidateBox.x = x = nx;
            candidateBox.y = y = ny;
        }
        inflateBoxInto(queryBox, candidateBox, inflate);
        if (boxContains(region, x, y, cw, ch) && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
            return {
                index,
                text,
                x,
                y,
                width,
                height,
                datum: d,
                placement: undefined,
                rotation: c.rotation,
                offsetX,
                offsetY,
                candidate: c,
            };
        }
        const overflow = d.neverDrop ? regionOverflow(region, x, y, cw, ch) : Infinity;
        if (overflow < bestOverflow) {
            bestOverflow = overflow;
            bestX = x;
            bestY = y;
            bestOffsetX = offsetX;
            bestOffsetY = offsetY;
            bestCandidate = c;
        }
    }

    if (bestCandidate == null) return undefined;
    return {
        index,
        text,
        x: bestX,
        y: bestY,
        width,
        height,
        datum: d,
        placement: undefined,
        rotation: bestCandidate.rotation,
        offsetX: bestOffsetX,
        offsetY: bestOffsetY,
        candidate: bestCandidate,
    };
}

function orientationsOf(d: PointLabelDatum): AgChartLabelOrientation[] | undefined {
    return Array.isArray(d.orientation) ? d.orientation : undefined;
}

function singleOrientationOf(d: PointLabelDatum): AgChartLabelOrientation | undefined {
    return Array.isArray(d.orientation) ? undefined : d.orientation;
}

/** Slides a `size`-long span starting at `pos` flush inside `[min, min+extent]`; unchanged when it is too big to fit. */
function clampAxis(pos: number, size: number, min: number, extent: number): number {
    if (size > extent) return pos;
    return Math.min(Math.max(pos, min), min + extent - size);
}

/** Total px a `w`×`h` box at `(x, y)` extends beyond `region` across all four sides; `0` when contained. */
function regionOverflow(region: BoxBounds, x: number, y: number, w: number, h: number): number {
    return (
        Math.max(0, region.x - x) +
        Math.max(0, x + w - (region.x + region.width)) +
        Math.max(0, region.y - y) +
        Math.max(0, y + h - (region.y + region.height))
    );
}

/** The `i`-th candidate: `list[i]` when a candidate list is present, else the lone `single` value. */
function candidateAt<T>(list: readonly T[] | undefined, single: T | undefined, i: number): T | undefined {
    return list ? list[i] : single;
}

/**
 * Positions one (placement, orientation) candidate into the shared {@link candidateBox} — its
 * top-left offset and its rotated footprint as width/height — and returns the render rotation in
 * degrees (`0` when the orientation is unset).
 */
function positionCandidate(
    d: PointLabelDatum,
    placement: LabelPlacement | undefined,
    orientation: AgChartLabelOrientation | undefined,
    width: number,
    height: number,
    gap: number,
    spacing: number
): number {
    const rotation = orientation == null ? 0 : orientationAngles[orientation];
    rotatedSizeInto(rotation, width, height);
    positionLabelBox(candidateBox, d, rotatedSize.width, rotatedSize.height, gap, spacing, placement);
    candidateBox.width = rotatedSize.width;
    candidateBox.height = rotatedSize.height;
    return rotation;
}
