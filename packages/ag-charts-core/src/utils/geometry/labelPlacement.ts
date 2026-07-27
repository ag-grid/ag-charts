import type { AgChartLabelOrientation, OverflowStrategy, PaddingOptions, TextWrap } from 'ag-charts-types';

import { cachedTextMeasurer, measureTextSegments } from '../../rendering/textMeasurer';
import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { Point, SizedPoint } from '../../types/scene';
import type { FontOptions } from '../../types/text';
import { toArray } from '../data/arrays';
import { toTextString } from '../text/textUtils';
import { type LabelFit, fitLabelText } from '../text/textWrapper';
import { isArray } from '../types/typeGuards';
import { toDegrees, toRadians } from './angle';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import { getMinOuterRectSize } from './math/shapeUtils';
import { SpatialIndex, gridCellSize } from './spatialIndex';

export type { LabelFit } from '../text/textWrapper';

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
 * Resolves the label-surface fit fields to an engine {@link LabelFit}, mapping the public `truncate`
 * boolean onto the internal overflow strategy:
 *  - `truncate: true` or `defaultToTruncate` → `'ellipsis'`: the bound is applied and overflow truncates with an ellipsis.
 *  - `truncate` unset + `hideOnOverflow` → `'hide'`: the bound is applied and the label hides if it overflows.
 *  - otherwise → a fit is produced only when `wrapping` is set (so wrap applies on its own); with no
 *    overflow strategy and no wrapping the full text renders unbounded, as before.
 *
 * `maxWidth`/`maxHeight` alone never activate a fit, so series carrying only a `maxWidth` default stay
 * unbounded exactly as before.
 *
 * @param defaultToTruncate When `truncate` is unset, ellipsise on overflow rather than hide. Used by
 * inside-marker labels, which are bound to the marker box and must never vanish when the text overruns it.
 */
export function resolveLabelFit(
    fit: LabelFitOptions,
    hideOnOverflow = false,
    defaultToTruncate = false
): LabelFit | undefined {
    const { maxWidth, maxHeight, wrapping, truncate } = fit;
    let overflowStrategy: OverflowStrategy | undefined;
    if (truncate || defaultToTruncate) {
        overflowStrategy = 'ellipsis';
    } else if (hideOnOverflow) {
        overflowStrategy = 'hide';
    }
    if (overflowStrategy == null && wrapping == null) return undefined;
    return { maxWidth, maxHeight, wrapping, overflowStrategy };
}

/**
 * Everything the engine needs to fit a label's text to an individual candidate rather than to one
 * container chosen up front. Set only when the label opted into overflow control; without it every
 * candidate reuses the datum's measured {@link PointLabelDatum.label} and no text is ever re-fitted.
 */
export interface LabelFitDescriptor {
    /** Unfitted source text, so a candidate never inherits the truncation an earlier candidate needed. */
    readonly text: NormalisedTextOrSegments;
    readonly policy: LabelFit;
    readonly font: FontOptions;
    /**
     * Per-side extent of the drawn box around the glyph. The candidate geometry works in box space, so
     * this is subtracted from a container to get the glyph budget and added back to the fitted glyph.
     */
    readonly boxPadding?: Required<PaddingOptions>;
}

/**
 * Per-candidate inputs for {@link LabelFitDescriptor} on the positioned-candidate path, where the series
 * owns the geometry: `container` is the glyph budget this candidate offers (its region minus the drawn
 * box, axes swapped when the candidate is rotated) and `anchor`/`padding` rebuild {@link
 * PositionedLabelCandidate.box} around the newly fitted glyph. A candidate that floats free of any region
 * leaves `container` unset, so only the fit policy's own bounds apply to it.
 */
export interface CandidateFitTarget {
    readonly container?: { readonly width: number; readonly height: number };
    /** Anchor the drawn box hangs off, so its centre can be re-derived when the fitted glyph resizes it. */
    readonly anchor: OrientationAnchor;
    /** Per-side extent of the drawn box around the glyph. */
    readonly padding: Required<PaddingOptions>;
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
    /**
     * When `false`, {@link region} is a collision boundary only: a box overflowing it is rejected so the
     * cascade falls through to the next candidate, rather than being slid flush inside it. Defaults to
     * flushing (a region-bound `neverDrop` label is clamped into its region).
     */
    readonly flushToRegion?: boolean;
    /** Render rotation in degrees (engine convention, matching {@link PlacedLabel.rotation}); `0`/unset is upright. */
    readonly rotation?: number;
    /** Fit inputs for this candidate; used only when the datum carries a {@link PointLabelDatum.fit}. */
    readonly fitTo?: CandidateFitTarget;
}

export interface PointLabelDatum {
    readonly point: Readonly<SizedPoint>;
    readonly label: MeasuredLabel;
    /**
     * Re-fits the text to each candidate in turn instead of to one container picked before the cascade,
     * so a candidate that can hold the whole text is not disqualified by an earlier candidate's
     * truncation. The cascade then prefers an untruncated candidate and settles for the least-truncated
     * one. When unset, {@link label} is used as measured and no candidate is ever re-fitted.
     */
    readonly fit?: LabelFitDescriptor;
    readonly anchor: Point | undefined;
    /**
     * Shifts an `inside` label off the marker centre by this fraction of the marker diameter (x, y
     * down), so the label sits at the largest rectangle within a non-centred shape. Applied only for
     * the `inside` placement, leaving directional placements unaffected.
     */
    readonly insideOffset?: Readonly<Point>;
    /**
     * Marker inscribed-rectangle size as a fraction of the marker diameter. When set, an `inside`
     * candidate must fit this rect (scaled by {@link point}.size) to be chosen, so a label too large
     * for the marker fails inside and cascades to the next {@link placements} entry. Left unset when
     * `inside` is the sole placement, where the text is instead fitted to the marker up front.
     */
    readonly insideSize?: Readonly<{ width: number; height: number }>;
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
     * When no candidate fits its region and clears every obstacle: keep the label at its
     * least-overflowing candidate (`true`) or drop it (`false`). Overrides the series
     * {@link SeriesLabelDefaults.alwaysShow} when set; the engine defaults to keeping the label.
     */
    readonly alwaysShow?: boolean;
    /**
     * Distance in px between the label and its anchor point. Overrides the series
     * {@link SeriesLabelDefaults.spacing} when set, else falls back to the `padding` argument of
     * {@link placeLabels}.
     */
    readonly spacing?: number;
    /**
     * Resolved per-category obstacle configuration. Overrides the series
     * {@link SeriesLabelDefaults.collideWith} when set.
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
    /**
     * The label's own bar rect (full-column geometry, matching its `seriesItem` obstacle box). Any
     * `seriesItem` obstacle intersecting it is treated as non-colliding, so a bar label avoids other
     * bars without ever colliding with its own bar, its stacked siblings, or `grouped:false`
     * behind-bars that overlap it. Set only on the positioned-candidate path with `seriesItem`
     * avoidance enabled.
     */
    readonly ownBox?: BoxBounds;
    /**
     * Keep `category: 'label'` obstacles that overlap this label's own box as real obstacles rather
     * than excluding them with the own-box gate. Range-bar sets this because both its labels share the
     * one bar rect, so a sibling label sitting inside that rect must still be avoided (letting the
     * placement cascade advance one label outside). Its own bar and marker stay excluded. Unset
     * preserves the default exclude-all-categories behaviour for stacked/grouped bars.
     */
    readonly ownBoxLabelsCollide?: boolean;
}

export type ObstacleCategory = 'marker' | 'label' | 'seriesItem';

/** Per-category toggle: `false` disables avoidance of that obstacle category. */
export interface CollideWith {
    readonly marker?: boolean;
    readonly label?: boolean;
    readonly seriesItem?: boolean;
    /** Whether the label must stay inside the series plotting area; a series attaches its plot region when set. */
    readonly seriesArea?: boolean;
}

/**
 * Series-level collision defaults shared by every label in a series, resolved once per render from
 * the series' collision config. A datum's own field ({@link PointLabelDatum.alwaysShow} etc.)
 * overrides the matching default; when unset the engine falls back to these.
 */
export interface SeriesLabelDefaults {
    readonly alwaysShow?: boolean;
    /** Distance in px between each label and its anchor; a datum's own {@link PointLabelDatum.spacing} overrides it. */
    readonly spacing?: number;
    /** Collision-detection threshold applied to the label's own box: positive grows it, negative shrinks it. */
    readonly threshold?: number;
    readonly collideWith?: CollideWith;
    readonly placements?: readonly LabelPlacement[];
}

/** Per-series label placement input: the datums plus the series-level collision defaults. */
export interface SeriesLabels {
    readonly datums: readonly PointLabelDatum[];
    readonly defaults?: SeriesLabelDefaults;
}

/** Structural source of a series' resolved collision config (community `LabelCollision`). */
export interface LabelCollisionSource {
    readonly alwaysShow?: boolean;
    readonly threshold?: number;
    resolveCollideWith(): CollideWith | undefined;
}

/** Resolves a series' collision config into the shared {@link SeriesLabelDefaults}. */
export function resolveSeriesLabelDefaults(
    src: LabelCollisionSource,
    placements?: readonly LabelPlacement[],
    spacing?: number
): SeriesLabelDefaults {
    return {
        alwaysShow: src.alwaysShow,
        spacing,
        threshold: src.threshold,
        collideWith: src.resolveCollideWith(),
        placements,
    };
}

/** Label offset applied at a markerless vertex (size 0), where the marker radius can't supply one. */
export const DEFAULT_MARKERLESS_LABEL_GAP = 2;

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

/** Which value-axis end(s) an inside bar label is anchored against, so `spacing` reserves its gap there. */
export type BarValueAnchor = 'start' | 'center' | 'end';

/**
 * Value-axis `spacing` reservation for an inside label, as an inset on the axis' min and max sides. A
 * directional label reserves the gap on its single anchored end (text then fills toward the far end); a
 * centred label reserves nothing (it fills to both edges, never shifted off centre). `start`/`end` map
 * to the physical min/max side per bar orientation and direction — `start` anchors at the value origin.
 */
export function insideBarValueInsets(
    anchor: BarValueAnchor,
    isUpward: boolean,
    isVertical: boolean,
    spacing: number
): { min: number; max: number } {
    if (anchor === 'center') return { min: 0, max: 0 };
    // The value-origin ('start') end sits at the axis minimum for a downward vertical / upward horizontal bar.
    const startAtMin = isVertical ? !isUpward : isUpward;
    const anchoredAtMin = anchor === 'start' ? startAtMin : !startAtMin;
    return anchoredAtMin ? { min: spacing, max: 0 } : { min: 0, max: spacing };
}

/**
 * Inside-label containment region: the bar rect inset by `threshold` on the cross axis (wall-clearance
 * from the bar's side edges) and by the {@link insideBarValueInsets} `spacing` reservation on the value
 * axis — the gap the label keeps from the end(s) it is anchored against. The engine flushes and contains
 * labels against this region, so the gap survives orientation/placement resolution, not just the anchor.
 */
export function insideBarRegion(
    rect: BoxBounds,
    valueMinInset: number,
    valueMaxInset: number,
    threshold: number,
    isVertical: boolean
): BoxBounds {
    return isVertical
        ? {
              x: rect.x + threshold,
              y: rect.y + valueMinInset,
              width: rect.width - 2 * threshold,
              height: rect.height - valueMinInset - valueMaxInset,
          }
        : {
              x: rect.x + valueMinInset,
              y: rect.y + threshold,
              width: rect.width - valueMinInset - valueMaxInset,
              height: rect.height - 2 * threshold,
          };
}

/** Text container for a label inside its bar region: the region shrunk by the box drawn around the text. */
export function insideBarContainer(
    region: BoxBounds,
    box: Required<PaddingOptions>
): { width: number; height: number } {
    return {
        width: Math.max(0, region.width - box.left - box.right),
        height: Math.max(0, region.height - box.top - box.bottom),
    };
}

/**
 * Size of the largest axis-aligned rectangle a horizontal label can occupy centred on `anchor` inside an
 * origin-centred annular wedge. Lets a pie/donut sector label wrap/truncate to the room the wedge offers, the
 * way a bar label fits its rect. `lineHeight` seeds the width with one line's height so the first line clears
 * the arc; the returned height then bounds how many lines survive. Deliberately conservative — each boundary is
 * treated independently — so the box always fits; placement (which is not centred on the anchor for a tilted
 * wedge) is refined separately by the caller.
 */
export function sectorLabelContainer(
    anchor: { x: number; y: number },
    sector: { startAngle: number; endAngle: number; innerRadius: number; outerRadius: number },
    lineHeight: number
): { width: number; height: number } {
    const { startAngle, endAngle, innerRadius, outerRadius } = sector;
    const px = Math.abs(anchor.x);
    const py = Math.abs(anchor.y);
    const radius = Math.hypot(px, py);
    if (radius < 1e-6) return { width: 0, height: 0 };

    const cosMid = px / radius;
    const sinMid = py / radius;
    const halfSpan = Math.min(Math.abs(endAngle - startAngle) / 2, Math.PI / 2);
    const edgeDistance = radius * Math.sin(halfSpan);
    const edges = [startAngle, endAngle].map((angle) => ({
        sin: Math.abs(Math.sin(angle)),
        cos: Math.abs(Math.cos(angle)),
    }));

    // Half-width the wedge allows for a box of half-height `b`: bounded by the outer arc (worst outward corner),
    // each straight edge (box extent along the edge normal ≤ its perpendicular distance) and, for a donut, the
    // inner arc (radial-inward extent ≤ the ring depth).
    const halfWidthGiven = (b: number) => {
        const outer = Math.sqrt(Math.max(0, outerRadius ** 2 - (py + b) ** 2)) - px;
        const edgeLimits = edges.map((e) => (e.sin > 1e-6 ? (edgeDistance - b * e.cos) / e.sin : Infinity));
        const inner = innerRadius > 0 && cosMid > 1e-6 ? (radius - innerRadius - b * sinMid) / cosMid : Infinity;
        return Math.max(0, Math.min(outer, inner, ...edgeLimits));
    };
    const halfHeightGiven = (a: number) => {
        const outer = Math.sqrt(Math.max(0, outerRadius ** 2 - (px + a) ** 2)) - py;
        const edgeLimits = edges.map((e) => (e.cos > 1e-6 ? (edgeDistance - a * e.sin) / e.cos : Infinity));
        const inner = innerRadius > 0 && sinMid > 1e-6 ? (radius - innerRadius - a * cosMid) / sinMid : Infinity;
        return Math.max(0, Math.min(outer, inner, ...edgeLimits));
    };

    const halfHeightSeed = lineHeight / 2;
    const halfWidth = halfWidthGiven(halfHeightSeed);
    const halfHeight = Math.max(halfHeightSeed, halfHeightGiven(halfWidth));
    return { width: 2 * halfWidth, height: 2 * halfHeight };
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
    /** The text fitted to the chosen candidate, when the label opted into per-candidate overflow control. */
    fittedText?: NormalisedTextOrSegments;
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
 * Centre of a bar label's drawn box, written into `out`. The anchor sits on the glyph's edge while the
 * box protrudes `padding[facing]` past it toward the bar, so the centre is pushed back by that padding —
 * otherwise the collision footprint reaches further onto a neighbour than what is rendered and the label
 * collides before its box actually touches.
 */
export function writeLabelBoxCentre(
    out: Point,
    anchor: OrientationAnchor,
    boxWidth: number,
    boxHeight: number,
    padding: Required<PaddingOptions>
): Point {
    const { x, y } = labelGlyphCentre(anchor, boxWidth, boxHeight);
    out.x = x;
    out.y = y;
    if (anchor.textAlign === 'right' || anchor.textAlign === 'end') {
        out.x += padding.right;
    } else if (anchor.textAlign === 'left' || anchor.textAlign === 'start') {
        out.x -= padding.left;
    }
    if (anchor.textBaseline === 'bottom') {
        out.y += padding.bottom;
    } else if (anchor.textBaseline === 'top') {
        out.y -= padding.top;
    }
    return out;
}

/**
 * Axis-aligned obstacle footprint of a rendered label: its padded box centred on the glyph — the
 * renderer pivots rotation about that centre — then the rotated box's outer AABB. `padding` is the
 * per-side box extent (padding plus any border) and `rotationRad` the render rotation in radians, so
 * a series can register a baked label (one not routed through {@link placeLabels}) as a `label`
 * obstacle other series' labels must avoid. At `rotationRad === 0` the box is exact.
 */
export function labelFootprintBox(
    anchor: OrientationAnchor,
    glyphWidth: number,
    glyphHeight: number,
    padding: Required<PaddingOptions>,
    rotationRad: number
): BoxBounds {
    const boxWidth = glyphWidth + padding.left + padding.right;
    const boxHeight = glyphHeight + padding.top + padding.bottom;
    const glyph = labelGlyphCentre(anchor, glyphWidth, glyphHeight);
    const cx = glyph.x + (padding.right - padding.left) / 2;
    const cy = glyph.y + (padding.bottom - padding.top) / 2;
    const { width, height } = getMinOuterRectSize(toDegrees(rotationRad), boxWidth, boxHeight);
    return { x: cx - width / 2, y: cy - height / 2, width, height };
}

/**
 * Builds the {@link PointLabelDatum} routing a bar label through the placement engine: centred on its
 * glyph box, constrained to `region` (its bar rect, or `undefined` for the plot bounds), offering the
 * `orientations` candidates, avoiding the obstacle categories `collideWith` enables. The `region` doubles
 * as the label's own-shape box: it lies within the bar rect, so a `seriesItem` obstacle for the label's
 * own bar (which the region overlaps) is excluded while neighbouring bars — which the region cannot reach
 * — are still avoided.
 */
export function buildBarLabelDatum(
    anchor: OrientationAnchor,
    text: NormalisedTextOrSegments,
    width: number,
    height: number,
    orientations: AgChartLabelOrientation[],
    region: BoxBounds | undefined,
    collideWith: CollideWith,
    target: BarLabelTarget,
    fit?: LabelFitDescriptor
): BarPlacedLabelDatum {
    const { x, y } = labelGlyphCentre(anchor, width, height);
    return {
        point: { x, y, size: 0 },
        label: { text, width, height },
        fit,
        anchor: undefined,
        placement: undefined,
        orientation: orientations,
        gap: 0,
        neverDrop: true,
        collideWith,
        region,
        ownBox: region,
        target,
    };
}

/**
 * Builds the {@link PointLabelDatum} routing a bar label through the positioned-candidate engine path:
 * the pre-positioned `candidates` are cascaded in order (each carries its own region), avoiding other
 * labels and bars in other columns. Dropped when no candidate fits unless `alwaysShow`. Hands the
 * engine opaque boxes instead of an orientation array to resolve.
 */
export function buildBarPositionedLabelDatum(
    text: NormalisedTextOrSegments,
    width: number,
    height: number,
    candidates: readonly PositionedLabelCandidate[],
    target: BarLabelTarget,
    ownBox: BoxBounds,
    alwaysShow: boolean,
    collideWith: CollideWith,
    ownBoxLabelsCollide = false,
    fit?: LabelFitDescriptor
): BarPlacedLabelDatum {
    return {
        point: { x: 0, y: 0, size: 0 },
        label: { text, width, height },
        fit,
        anchor: undefined,
        placement: undefined,
        gap: 0,
        // When labels are hideable (`alwaysShow: false`) a no-fit candidate is dropped so the caller
        // can hide it; otherwise the engine keeps the least-overflowing candidate.
        neverDrop: alwaysShow,
        collideWith,
        positionedCandidates: candidates,
        ownBox,
        ownBoxLabelsCollide,
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
    for (const { datum, rotation, offsetX, offsetY, candidate, text } of placed) {
        const { target, fit } = datum as BarPlacedLabelDatum;
        target.rotation = toRadians(rotation ?? 0);
        target.offsetX = offsetX ?? 0;
        target.offsetY = offsetY ?? 0;
        // The engine fitted the text to the candidate it chose, so the node must render that rather than
        // the unfitted source the datum was built from.
        target.fittedText = fit == null ? undefined : text;
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
 * The set of bar-label targets the engine kept (placed). A hideable label the engine dropped is absent,
 * so its series can hide the routed label whose `target` this set does not contain.
 */
export function placedBarLabelTargets(placed: readonly PlacedLabel<unknown>[]): Set<BarLabelTarget> {
    const targets = new Set<BarLabelTarget>();
    for (const { datum } of placed) {
        targets.add((datum as BarPlacedLabelDatum).target);
    }
    return targets;
}

/**
 * Flags each routed bar label hidden when the engine dropped it: a routed label (`candidates` set) the
 * engine kept is in `placed`, one it dropped is absent. Baked labels (no candidates) are left visible.
 * `resolveTarget` maps each element to its label object, which doubles as its {@link BarLabelTarget}.
 */
export function applyPlacedBarLabelVisibility<T>(
    elements: Iterable<T> | undefined,
    placed: readonly PlacedLabel<unknown>[],
    resolveTarget: (element: T) => (BarLabelTarget & { candidates?: unknown; hidden?: boolean }) | undefined
): void {
    const kept = placedBarLabelTargets(placed);
    for (const element of elements ?? []) {
        const target = resolveTarget(element);
        if (target?.candidates != null) target.hidden = !kept.has(target);
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

/**
 * Whether a bar-family label must route through the placement engine rather than take its unconditional
 * fast-path bake: a multi-entry orientation or placement array cascades through obstacles, and a hideable
 * label (`alwaysShow: false`) routes even a single placement so a no-fit label can be dropped and hidden.
 */
export function barLabelRoutesThroughEngine(
    orientation: AgChartLabelOrientation | AgChartLabelOrientation[] | undefined,
    placement: unknown,
    alwaysShow: boolean
): boolean {
    return barLabelResolvesOrientation(orientation) || barLabelResolvesPlacement(placement) || !alwaysShow;
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
    /** Pre-measured footprint (text plus box padding/border); falls back to measuring `label.text` with `config`. */
    readonly size?: { width: number; height: number };
    /** Resolved obstacle-category toggles for this label, stamped onto the datum. */
    readonly collideWith: CollideWith;
    /** Per-candidate fit inputs, so each orientation gets the text refitted to the room it actually has. */
    readonly fit?: LabelFitDescriptor;
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
        const { width, height } = source.size ?? measureLabelText(label.text, config);
        data.push(
            buildBarLabelDatum(
                label,
                label.text,
                width,
                height,
                orientations,
                label.region,
                source.collideWith,
                label,
                source.fit
            )
        );
    }
    return data;
}

/** A rect-shaped node (bar, histogram bin) contributed to the obstacle index as its drawn footprint. */
export interface RectObstacleSource {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly phantom?: boolean;
}

/**
 * Maps rect-shaped node data (bars, histogram bins) to `seriesItem` label obstacles so that labels from
 * other series route around them. Skips phantom (stacking/feather) nodes and zero-area rects.
 */
export function rectLabelObstacles(nodeData: readonly RectObstacleSource[] | undefined): LabelObstacle[] | undefined {
    if (nodeData == null || nodeData.length === 0) return undefined;
    const obstacles: LabelObstacle[] = [];
    for (const { x, y, width, height, phantom } of nodeData) {
        if (phantom === true || width <= 0 || height <= 0) continue;
        obstacles.push({ kind: 'rect', box: { x, y, width, height }, category: 'seriesItem' });
    }
    return obstacles.length > 0 ? obstacles : undefined;
}

/** A baked bar-family label paired with the config and per-side box extent that size its footprint. */
export interface BakedLabelSource {
    readonly label:
        | (OrientationAnchor & { text: NormalisedTextOrSegments; rotation: number; hidden?: boolean })
        | undefined;
    /** Font config for glyph measurement. */
    readonly config: FontOptions;
    /** Per-side drawn-box extent (padding plus any border). */
    readonly box: Required<PaddingOptions>;
}

/**
 * Builds `label` obstacles for a series' baked labels — labels drawn without routing through
 * {@link placeLabels}, so they never enter the obstacle index there. Contributing their drawn footprint
 * lets other series' labels avoid them. Skips absent, empty-text and hidden labels.
 */
export function bakedLabelObstacles<T>(
    elements: Iterable<T> | undefined,
    resolve: (element: T) => BakedLabelSource | undefined
): LabelObstacle[] | undefined {
    const obstacles: LabelObstacle[] = [];
    for (const element of elements ?? []) {
        const source = resolve(element);
        const label = source?.label;
        if (source == null || label == null || label.text === '' || label.hidden === true) continue;
        const { width, height } = measureLabelText(label.text, source.config);
        const box = labelFootprintBox(label, width, height, source.box, label.rotation);
        obstacles.push({ kind: 'rect', box, category: 'label' });
    }
    return obstacles.length > 0 ? obstacles : undefined;
}

/**
 * Combines a bar-family series' rendered-rect obstacles (`seriesItem`) with the footprints of its baked
 * labels (`label`) — the obstacle set other series' labels must avoid. `bakeLabels` must be false when the
 * series routes its labels through {@link placeLabels}: the engine indexes each routed label as it places
 * it, so baking them here too would double-count them (see the caller's `usesPlacedLabels` guard).
 */
export function barLabelObstacles<T>(
    nodeData: readonly RectObstacleSource[] | undefined,
    labelData: Iterable<T> | undefined,
    bakeLabels: boolean,
    resolveBaked: (element: T) => BakedLabelSource | undefined
): LabelObstacle[] | undefined {
    const rects = rectLabelObstacles(nodeData);
    if (!bakeLabels) return rects;
    const labels = bakedLabelObstacles(labelData, resolveBaked);
    if (labels == null) return rects;
    return rects == null ? labels : rects.concat(labels);
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

// Mutable placed-label obstacle pooled across passes, mirroring markerPool.
interface PooledRectObstacle {
    kind: 'rect';
    box: BoxBounds;
    category: ObstacleCategory;
}

// Scratch state reused across passes (placeLabels is not reentrant in the single-threaded render loop).
const obstacleIndex = new SpatialIndex<LabelObstacle>();
const markerPool: PooledCircleObstacle[] = [];
const labelObstaclePool: PooledRectObstacle[] = [];
const candidateBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
// Broad-phase query box: the candidate inflated by the positive part of the collision threshold, a
// superset of the narrow-phase test box even when the threshold is negative (a shrunk box).
const queryBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
// The marker inscribed rect an `inside` candidate is contained by, co-centred with its label box.
const insideRegionBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
const inflatedBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
// The candidate datum's per-category obstacle config, set before each obstacle query.
let candidateCollideWith: CollideWith | undefined;
// Collision-detection threshold applied to the candidate's own box: positive grows it (more clearance),
// negative shrinks it (tolerates overlap). Set per label before its obstacle queries.
let candidateThreshold = 0;
// The directional gap between the label and its anchor marker's edge. The label collides with its own
// anchor marker only when the threshold demands more clearance than this gap. Set per label.
let candidateSpacing = 0;
// The placement of the candidate being tested.
let candidatePlacement: LabelPlacement | undefined;
// Centre and radius of the candidate datum's own anchor marker; the label is placed a fixed gap from
// it, so it is handled by the spacing gate rather than normal collision. The radius disambiguates it
// from a coincident marker of a different size (e.g. stacked bubbles). Set per datum before its
// obstacle queries; centre is NaN and radius -1 (never matches) for candidates with no own marker.
let candidateOwnMarkerCx = 0;
let candidateOwnMarkerCy = 0;
let candidateOwnMarkerR = -1;
// The candidate datum's own shape rect (bar labels only): any obstacle intersecting it is excluded so
// an inside label never collides with the shape it sits on. `undefined` disables the gate (marker
// series, whose own marker is handled by the own-marker circle gate instead).
let candidateOwnBox: BoxBounds | undefined;
// When true, `category: 'label'` obstacles overlapping `candidateOwnBox` are not excluded by the
// own-box gate (range-bar's two labels share one bar rect and must still avoid each other).
let candidateOwnBoxLabelsCollide = false;
// The label's text/box after the fit step, reused per candidate to keep the hot path allocation-free.
// `dropped` is how many characters truncation removed, ranking candidates when none holds the full text.
const fittedLabel: { text: NormalisedTextOrSegments; width: number; height: number; dropped: number } = {
    text: '',
    width: 0,
    height: 0,
    dropped: 0,
};
// The fit policy bounded by the current candidate's container, refilled per candidate.
const boundedFit: {
    maxWidth?: number;
    maxHeight?: number;
    wrapping?: TextWrap;
    overflowStrategy?: OverflowStrategy;
} = {};
// Glyph budget of the candidate being fitted, refilled per candidate on the compass path.
const candidateContainer = { width: 0, height: 0 };
// Drawn-box centre of a positioned candidate whose box a re-fit resized.
const boxCentre: Point = { x: 0, y: 0 };
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
    // The label's own anchor marker, when the label is offset from it (a directional or `inside`
    // placement — not the centred default, which genuinely sits over the marker): an `inside` label is
    // centred on it and never avoids it; a directional label sits a fixed `spacing` gap from it and
    // avoids it only when the threshold demands more clearance than that gap (`threshold > spacing`),
    // never at the default threshold of 0.
    if (
        candidatePlacement != null &&
        category === 'marker' &&
        o.kind === 'circle' &&
        o.cx === candidateOwnMarkerCx &&
        o.cy === candidateOwnMarkerCy &&
        o.r === candidateOwnMarkerR
    ) {
        return candidatePlacement !== 'inside' && candidateThreshold > candidateSpacing;
    }

    // An on-shape (inside) label never collides with the shape it sits on: any obstacle overlapping the
    // label's own box — its own bar and anything coincident with it (stacked siblings sharing the
    // full-column box, grouped:false bars overlapping in the band, a marker or label sitting on the bar)
    // — is excluded, regardless of category. Only obstacles clear of the own shape are avoided.
    // `ownBoxLabelsCollide` opts sibling labels back in (range-bar's two labels share one bar rect).
    if (
        candidateOwnBox != null &&
        !(candidateOwnBoxLabelsCollide && category === 'label') &&
        boxCollides(o.box, candidateOwnBox.x, candidateOwnBox.y, candidateOwnBox.width, candidateOwnBox.height)
    ) {
        return false;
    }

    if (candidateCollideWith?.[category] === false) return false;

    // Grow (positive) or shrink (negative) the candidate box by the collision threshold before testing.
    // No inflation (the common case, threshold 0): test the candidate box directly.
    let testBox = candidateBox;
    if (candidateThreshold !== 0) {
        inflateBoxInto(inflatedBox, candidateBox, candidateThreshold);
        // A negative threshold that shrinks the box past its own extent means the label tolerates any
        // overlap on that axis; a collapsed box clears every obstacle rather than testing an inverted one.
        if (inflatedBox.width <= 0 || inflatedBox.height <= 0) return false;
        testBox = inflatedBox;
    }
    const { x, y, width, height } = testBox;
    switch (o.kind) {
        case 'circle':
            return circleOverlapsBox(o.cx, o.cy, o.r, x, y, width, height);
        case 'rect':
            return boxCollides(o.box, x, y, width, height);
        case 'custom':
            return o.overlaps(testBox);
    }
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

/** True if any series has labels to place; gates the per-update sort and obstacle-index build. */
function hasAnyLabels(data: Map<string, SeriesLabels>): boolean {
    for (const entry of data.values()) {
        if (entry.datums[0]?.label != null) return true;
    }
    return false;
}

/** True if the series can drop a label on collision: its default hides, or any datum opts in. */
function seriesHides(entry: SeriesLabels): boolean {
    if (entry.defaults?.alwaysShow === false) return true;
    return entry.datums.some((d) => d.alwaysShow === false);
}

/**
 * Series entries with all keep-series (never dropped) first, then droppable ones, both stable. Keep
 * labels seed the index as fixed obstacles before any droppable label resolves, so cross-series
 * precedence does not depend on declaration order. Single pass — `seriesHides` (an O(datums) scan) is
 * evaluated once per series rather than once per partition.
 */
function orderKeepFirst(data: Map<string, SeriesLabels>): [string, SeriesLabels][] {
    const keep: [string, SeriesLabels][] = [];
    const drop: [string, SeriesLabels][] = [];
    for (const entry of data.entries()) {
        (seriesHides(entry[1]) ? drop : keep).push(entry);
    }
    return keep.concat(drop);
}

/**
 * A label with a single kept placement: the obstacle query could only ever return that same placement,
 * so it takes its placement unconditionally and never touches the index — neither querying it nor
 * seeding it. When every label across every series is sole-candidate, the index is never consulted and
 * building it is wasted work (see {@link placeLabels}).
 */
function isSoleCandidateKeep(d: PointLabelDatum, defaults: SeriesLabelDefaults | undefined): boolean {
    const alwaysShow = d.alwaysShow ?? defaults?.alwaysShow ?? true;
    if (!alwaysShow || d.positionedCandidates != null || d.neverDrop === true) return false;
    const placements = d.placements ?? defaults?.placements;
    return (placements?.length ?? 1) <= 1 && (orientationsOf(d)?.length ?? 1) <= 1;
}

/** True when no label anywhere will query the obstacle index, so the index need not be built. */
function noLabelQueriesIndex(data: Map<string, SeriesLabels>): boolean {
    for (const { datums, defaults } of data.values()) {
        for (const d of datums) {
            if (d.label.text === '') continue;
            if (!isSoleCandidateKeep(d, defaults)) return false;
        }
    }
    return true;
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
 * @param data Points and labels for one or more series. Keep-series (never dropped) resolve first as
 * fixed obstacles, then droppable series; within each group, larger markers claim their placement first.
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

    // placeLabels runs on every chart update; a chart with no labels must not touch the index.
    if (!hasAnyLabels(data)) return result;

    // Larger markers claim their placement first, so smaller ones steer clear of them.
    const placementData = new Map(
        Array.from(data.entries(), ([k, entry]) => [
            k,
            { datums: entry.datums.toSorted((a, b) => b.point.size - a.point.size), defaults: entry.defaults },
        ])
    );

    // Common keep-only case (line/area/bar with a single placement): no label queries the index, so
    // building it and seeding it with obstacles is wasted work.
    const useIndex = !noLabelQueriesIndex(placementData);
    if (useIndex) {
        buildObstacleIndex(placementData, obstacles, bounds);
    }

    let labelObstacleCount = 0;
    for (const [seriesId, { datums, defaults }] of orderKeepFirst(placementData)) {
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
                if (useIndex) {
                    // Every placed label is a fixed obstacle for the labels resolved after it.
                    labelObstacleCount = insertLabelObstacle(placed, labelObstacleCount);
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

/** Inserts a placed label as a fixed obstacle via a pooled wrapper; returns the next pool index. */
function insertLabelObstacle(placed: PlacedLabel, count: number): number {
    const box = labelObstacleBox(placed);
    let obstacle = labelObstaclePool[count];
    if (obstacle == null) {
        obstacle = { kind: 'rect', box, category: 'label' };
        labelObstaclePool.push(obstacle);
    } else {
        obstacle.box = box;
    }
    obstacleIndex.insert(box, obstacle);
    return count + 1;
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

/** Number of characters in a label's text, summed across rich-text segments. */
function textLength(text: NormalisedTextOrSegments): number {
    if (!isArray(text)) return toTextString(text).length;
    let length = 0;
    for (const segment of text) {
        if (segment.type !== 'image') length += toTextString(segment.text).length;
    }
    return length;
}

/**
 * Fit axis of the two-axis model: adapts the label's source text to one candidate's glyph budget,
 * writing the result into the shared {@link fittedLabel} scratch. Returns `false` when the fit policy
 * hid the text outright, which disqualifies the candidate.
 *
 * The source text is measured first and returned untouched when it already fits, so the common case
 * never pays for wrapping; `source` carries that measurement in from the cascade, which reuses it
 * across candidates. `fittedLabel.dropped` counts the characters truncation removed, letting the
 * placement axis prefer the candidate that keeps the most text.
 */
function fitLabelToCandidate(
    fit: LabelFitDescriptor,
    source: { width: number; height: number } | undefined,
    container: { width: number; height: number } | undefined
) {
    const { text, policy, font } = fit;
    const maxWidth = Math.min(policy.maxWidth ?? Infinity, container?.width ?? Infinity);
    const maxHeight = Math.min(policy.maxHeight ?? Infinity, container?.height ?? Infinity);
    const full = source ?? measureLabelText(text, font);
    if (full.width <= maxWidth && full.height <= maxHeight) {
        fittedLabel.text = text;
        fittedLabel.width = full.width;
        fittedLabel.height = full.height;
        fittedLabel.dropped = 0;
        return true;
    }

    boundedFit.maxWidth = maxWidth === Infinity ? undefined : maxWidth;
    boundedFit.maxHeight = maxHeight === Infinity ? undefined : maxHeight;
    boundedFit.wrapping = policy.wrapping;
    boundedFit.overflowStrategy = policy.overflowStrategy;
    const fitted = fitLabelText(text, boundedFit, font);
    // `overflowStrategy: 'hide'` empties the text rather than truncating it; the candidate cannot show
    // this label at all, so the cascade must move on rather than place an empty box.
    if (fitted === '') return false;

    const size = measureLabelText(fitted, font);
    fittedLabel.text = fitted;
    fittedLabel.width = size.width;
    fittedLabel.height = size.height;
    fittedLabel.dropped = Math.max(0, textLength(text) - textLength(fitted));
    return true;
}

/**
 * The glyph budget a compass-path candidate offers: the datum's region minus the drawn box, with the
 * axes swapped for a rotated candidate (its glyph width runs along the region's height). `undefined`
 * when the datum has no region, leaving the candidate bound only by the fit policy.
 */
function compassCandidateContainer(d: PointLabelDatum, fit: LabelFitDescriptor, rotation: number) {
    const region = d.region;
    if (region == null) return undefined;
    const pad = fit.boxPadding;
    const upright = rotation % 180 === 0;
    const width = upright ? region.width : region.height;
    const height = upright ? region.height : region.width;
    candidateContainer.width = Math.max(0, width - (pad == null ? 0 : pad.left + pad.right));
    candidateContainer.height = Math.max(0, height - (pad == null ? 0 : pad.top + pad.bottom));
    return candidateContainer;
}

/**
 * Placement axis of the two-axis model: tries each candidate region for `d` in order — and, within
 * each, each candidate rotation — and returns the first whose fitted label fits within `bounds` and
 * clears every obstacle already in the index, or `undefined` if none do. Candidate placements resolve
 * from `d.placements`, then the series `defaults.placements`, then the single `d.placement`; orientation
 * from `d.orientation`. The reported box keeps the label's measured `width`/`height`; the rotated
 * footprint is used only for containment and obstacle tests. A sole-candidate label kept on overflow
 * takes its placement unconditionally — never bounds-clipped, and dropped only when its own fit policy
 * hides the text outright, which no placement can satisfy. A multi-candidate
 * placement or orientation list is a directional fallback set that cascades over obstacles; when none
 * clears them, `alwaysShow` decides whether the least-overflow candidate is kept or the label dropped.
 */
function tryPlaceLabel(
    d: PointLabelDatum,
    defaults: SeriesLabelDefaults | undefined,
    index: number,
    padding: number,
    bounds: BoxBounds
): PlacedLabel | undefined {
    // A datum's own field overrides the series default; when neither is set the label is kept.
    const alwaysShow = d.alwaysShow ?? defaults?.alwaysShow ?? true;
    const placements = d.placements ?? defaults?.placements;
    const collideWith = d.collideWith ?? defaults?.collideWith;
    const gap = d.gap ?? d.point.size / 2;
    const spacing = d.spacing ?? defaults?.spacing ?? padding;
    const threshold = defaults?.threshold ?? 0;

    // Sole-candidate keep-forever: one placement, kept on overflow, never dropped. The obstacle query
    // could only ever return this same placement, so skip it and take the placement unconditionally.
    if (isSoleCandidateKeep(d, defaults)) {
        const placement = candidateAt(placements, d.placement, 0);
        const orientation = candidateAt(orientationsOf(d), singleOrientationOf(d), 0);
        const rotation = orientation == null ? 0 : orientationAngles[orientation];
        let { text, width, height } = d.label;
        if (d.fit != null) {
            if (!fitLabelToCandidate(d.fit, undefined, compassCandidateContainer(d, d.fit, rotation))) return undefined;
            ({ text } = fittedLabel);
            width = fittedLabel.width + boxWidthOf(d.fit);
            height = fittedLabel.height + boxHeightOf(d.fit);
        }
        positionCandidate(d, placement, rotation, width, height, gap, spacing);
        const { x, y } = candidateBox;
        return { index, text, x, y, width, height, datum: d, placement, rotation: rotation || undefined };
    }

    return placeAvoidingLabel(d, placements, collideWith, alwaysShow, index, bounds, gap, spacing, threshold);
}

/** Total horizontal extent the drawn box adds around the glyph. */
function boxWidthOf(fit: LabelFitDescriptor): number {
    const pad = fit.boxPadding;
    return pad == null ? 0 : pad.left + pad.right;
}

/** Total vertical extent the drawn box adds around the glyph. */
function boxHeightOf(fit: LabelFitDescriptor): number {
    const pad = fit.boxPadding;
    return pad == null ? 0 : pad.top + pad.bottom;
}

/**
 * The candidate the cascade settles on when no candidate both holds the whole text and clears its
 * obstacles. Ranked by {@link CandidateChoice.tier} first — a truncated candidate that fits its region
 * always beats one that overflows it — then by `score` within the tier.
 */
interface CandidateChoice {
    tier: number;
    score: number;
    text: NormalisedTextOrSegments;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
    placement: LabelPlacement | undefined;
    candidate: PositionedLabelCandidate | undefined;
}

/** Tier of a candidate that fits its region and clears every obstacle, but only by truncating its text. */
const TIER_TRUNCATED = 0;
/** Tier of a candidate that overflows its region or hits an obstacle; kept only to avoid dropping the label. */
const TIER_OVERFLOWING = 1;

// Best candidate seen so far in the current cascade, reused across passes to keep the loop allocation-free.
const bestChoice: CandidateChoice = {
    tier: Infinity,
    score: Infinity,
    text: '',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    placement: undefined,
    candidate: undefined,
};

/** Records the candidate currently in {@link candidateBox} as the cascade's best, if it outranks the incumbent. */
function recordBestChoice(
    tier: number,
    score: number,
    text: NormalisedTextOrSegments,
    width: number,
    height: number,
    rotation: number,
    offsetX: number,
    offsetY: number,
    placement: LabelPlacement | undefined,
    candidate: PositionedLabelCandidate | undefined
) {
    if (tier > bestChoice.tier || (tier === bestChoice.tier && score >= bestChoice.score)) return;
    bestChoice.tier = tier;
    bestChoice.score = score;
    bestChoice.text = text;
    bestChoice.x = candidateBox.x;
    bestChoice.y = candidateBox.y;
    bestChoice.width = width;
    bestChoice.height = height;
    bestChoice.rotation = rotation;
    bestChoice.offsetX = offsetX;
    bestChoice.offsetY = offsetY;
    bestChoice.placement = placement;
    bestChoice.candidate = candidate;
}

/** Materialises {@link bestChoice} as the cascade's result, or `undefined` when no candidate was recorded. */
function placeBestChoice(index: number, d: PointLabelDatum): PlacedLabel | undefined {
    if (bestChoice.tier === Infinity) return undefined;
    return {
        index,
        text: bestChoice.text,
        x: bestChoice.x,
        y: bestChoice.y,
        width: bestChoice.width,
        height: bestChoice.height,
        datum: d,
        placement: bestChoice.placement,
        rotation: bestChoice.rotation || undefined,
        offsetX: bestChoice.offsetX,
        offsetY: bestChoice.offsetY,
        candidate: bestChoice.candidate,
    };
}

/**
 * Tries each `(placement × orientation)` candidate in order, returning the first whose rotated box holds
 * the whole text, fits `d.region ?? bounds` and clears every obstacle in the index. A candidate that
 * only fits by truncating is remembered and the cascade continues, so the least-truncated candidate wins
 * over an earlier heavily-truncated one. When no candidate fits at all: a {@link
 * PointLabelDatum.neverDrop} label, or one with `alwaysShow` set, keeps the least region-overflowing
 * candidate; otherwise the label is dropped (`undefined`). A `neverDrop` label is always rendered
 * (dropping it would revert its orientation to the baked first one), so it is kept regardless of
 * `alwaysShow`.
 */
function placeAvoidingLabel(
    d: PointLabelDatum,
    placements: readonly LabelPlacement[] | undefined,
    collideWith: CollideWith | undefined,
    alwaysShow: boolean,
    index: number,
    bounds: BoxBounds,
    gap: number,
    spacing: number,
    threshold: number
): PlacedLabel | undefined {
    bestChoice.tier = Infinity;
    bestChoice.score = Infinity;
    if (d.positionedCandidates != null) {
        return placeFromPositionedCandidates(d, collideWith, threshold, index, bounds);
    }
    const { fit } = d;
    // Measured once here rather than per candidate: every candidate refits the same source text.
    const fitSource = fit == null ? undefined : measureLabelText(fit.text, fit.font);
    const candidates = placements;
    const orientations = orientationsOf(d);
    const singleOrientation = singleOrientationOf(d);
    const inflate = Math.max(threshold, 0);
    candidateCollideWith = collideWith;
    candidateThreshold = threshold;
    candidateSpacing = spacing;
    markerCentreOf(d);
    candidateOwnMarkerCx = markerCentre.cx;
    candidateOwnMarkerCy = markerCentre.cy;
    candidateOwnMarkerR = d.point.size / 2;
    // Bar labels carry their own bar rect here so an inside label excludes its own shape; marker series
    // leave it unset (their own marker is handled by the own-marker circle gate above).
    candidateOwnBox = d.ownBox;
    candidateOwnBoxLabelsCollide = d.ownBoxLabelsCollide ?? false;
    const candidateCount = candidates?.length ?? 1;
    const orientationCount = orientations?.length ?? 1;
    const region = d.region ?? bounds;
    // Edge-anchored bar labels are centred on their glyph centre, which for inside-start/inside-end
    // sits at the bar's end; a candidate rotated to run along the bar would straddle that end. Slide
    // it flush inside its own bar rect instead (a no-op for inside-center, already centred).
    const flushToRegion = d.region != null && d.neverDrop;
    const keepBest = d.neverDrop === true || alwaysShow;

    for (let pi = 0; pi < candidateCount; pi++) {
        const placement = candidateAt(candidates, d.placement, pi);
        for (let oi = 0; oi < orientationCount; oi++) {
            const orientation = candidateAt(orientations, singleOrientation, oi);
            const rotation = orientation == null ? 0 : orientationAngles[orientation];
            let { text, width, height } = d.label;
            let dropped = 0;
            if (fit != null) {
                if (!fitLabelToCandidate(fit, fitSource, compassCandidateContainer(d, fit, rotation))) continue;
                ({ text, dropped } = fittedLabel);
                width = fittedLabel.width + boxWidthOf(fit);
                height = fittedLabel.height + boxHeightOf(fit);
            }
            positionCandidate(d, placement, rotation, width, height, gap, spacing);
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
            const containRegion = insideRegionFor(d, placement, x, y, cw, ch, threshold) ?? region;
            inflateBoxInto(queryBox, candidateBox, inflate);
            if (boxContains(containRegion, x, y, cw, ch) && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
                if (dropped === 0) {
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
                recordBestChoice(
                    TIER_TRUNCATED,
                    dropped,
                    text,
                    width,
                    height,
                    rotation,
                    offsetX,
                    offsetY,
                    placement,
                    undefined
                );
            } else if (keepBest) {
                const overflow = regionOverflow(containRegion, x, y, cw, ch);
                recordBestChoice(
                    TIER_OVERFLOWING,
                    overflow,
                    text,
                    width,
                    height,
                    rotation,
                    offsetX,
                    offsetY,
                    placement,
                    undefined
                );
            }
        }
    }

    return placeBestChoice(index, d);
}

/**
 * Cascades over {@link PointLabelDatum.positionedCandidates} in order, returning the first candidate
 * that holds the whole text, fits its own `region` (or the shared `bounds`) and clears every obstacle.
 * Runs only the generic containment/obstacle/flush/least-overflow logic — the series pre-computed each
 * candidate's geometry, so no placement maths happens here beyond resizing a candidate's box around
 * text it had to truncate. A truncated-but-fitting candidate is remembered and the cascade continues, so
 * the least-truncated one wins; when none fits at all, a {@link PointLabelDatum.neverDrop} datum keeps
 * the least region-overflowing candidate and any other is dropped (`undefined`).
 */
function placeFromPositionedCandidates(
    d: PointLabelDatum,
    collideWith: CollideWith | undefined,
    threshold: number,
    index: number,
    bounds: BoxBounds
): PlacedLabel | undefined {
    const candidates = d.positionedCandidates!;
    const inflate = Math.max(threshold, 0);
    candidateCollideWith = collideWith;
    candidateThreshold = threshold;
    candidateSpacing = 0;
    // No compass placement and no own marker on this path (bars): the own-marker gate in
    // obstacleOverlapsCandidate must stay inert, so no obstacle centre can match.
    candidatePlacement = undefined;
    candidateOwnMarkerCx = Number.NaN;
    candidateOwnMarkerCy = Number.NaN;
    candidateOwnMarkerR = -1;
    candidateOwnBox = d.ownBox;
    candidateOwnBoxLabelsCollide = d.ownBoxLabelsCollide ?? false;

    const { fit } = d;
    // Measured once here rather than per candidate: every candidate refits the same source text.
    const fitSource = fit == null ? undefined : measureLabelText(fit.text, fit.font);
    for (let ci = 0, ln = candidates.length; ci < ln; ci++) {
        const c = candidates[ci];
        const region = c.region ?? bounds;
        let { text, width, height } = d.label;
        let dropped = 0;
        candidateBox.x = c.box.x;
        candidateBox.y = c.box.y;
        candidateBox.width = c.box.width;
        candidateBox.height = c.box.height;
        if (fit != null && c.fitTo != null) {
            if (!fitLabelToCandidate(fit, fitSource, c.fitTo.container)) continue;
            ({ text, dropped } = fittedLabel);
            const { padding } = c.fitTo;
            width = fittedLabel.width + padding.left + padding.right;
            height = fittedLabel.height + padding.top + padding.bottom;
            resizeCandidateBox(c, width, height);
        }
        let { x, y } = candidateBox;
        const { width: cw, height: ch } = candidateBox;
        let offsetX = 0;
        let offsetY = 0;
        // Slide a region-bound candidate flush inside its own region (matches the orientation path's
        // clampAxis flush); a region-less (outside) candidate floats. A collision-only region
        // (flushToRegion === false) is not flushed — an overflowing box is left to fail containment below.
        if (c.region != null && c.flushToRegion !== false) {
            const nx = clampAxis(x, cw, region.x, region.width);
            const ny = clampAxis(y, ch, region.y, region.height);
            offsetX = nx - x;
            offsetY = ny - y;
            candidateBox.x = x = nx;
            candidateBox.y = y = ny;
        }
        inflateBoxInto(queryBox, candidateBox, inflate);
        const rotation = c.rotation ?? 0;
        if (boxContains(region, x, y, cw, ch) && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
            if (dropped === 0) {
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
            recordBestChoice(TIER_TRUNCATED, dropped, text, width, height, rotation, offsetX, offsetY, undefined, c);
        } else if (d.neverDrop === true) {
            const overflow = regionOverflow(region, x, y, cw, ch);
            recordBestChoice(TIER_OVERFLOWING, overflow, text, width, height, rotation, offsetX, offsetY, undefined, c);
        }
    }

    return placeBestChoice(index, d);
}

/** Rebuilds {@link candidateBox} as the rotated footprint of a re-fitted box, recentred on its anchor. */
function resizeCandidateBox(c: PositionedLabelCandidate, boxWidth: number, boxHeight: number) {
    const { anchor, padding } = c.fitTo!;
    writeLabelBoxCentre(boxCentre, anchor, boxWidth, boxHeight, padding);
    rotatedSizeInto(c.rotation ?? 0, boxWidth, boxHeight);
    candidateBox.x = boxCentre.x - rotatedSize.width / 2;
    candidateBox.y = boxCentre.y - rotatedSize.height / 2;
    candidateBox.width = rotatedSize.width;
    candidateBox.height = rotatedSize.height;
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
 * The marker inscribed rect an `inside` candidate must fit, co-centred with the candidate box (which
 * `insideOffset` already placed at that rect's centre), written into the shared {@link insideRegionBox}.
 * `threshold` shrinks the rect on every side (a positive value demands wall clearance; a negative one
 * lets the label bleed past the marker edge), mirroring its obstacle-avoidance sense. Returns
 * `undefined` for directional candidates or when the datum carries no {@link PointLabelDatum.insideSize},
 * so the caller falls back to the shared region.
 */
function insideRegionFor(
    d: PointLabelDatum,
    placement: LabelPlacement | undefined,
    x: number,
    y: number,
    boxWidth: number,
    boxHeight: number,
    threshold: number
): BoxBounds | undefined {
    if (placement !== 'inside' || d.insideSize == null) return undefined;
    const rw = Math.max(0, d.insideSize.width * d.point.size - 2 * threshold);
    const rh = Math.max(0, d.insideSize.height * d.point.size - 2 * threshold);
    insideRegionBox.x = x + boxWidth / 2 - rw / 2;
    insideRegionBox.y = y + boxHeight / 2 - rh / 2;
    insideRegionBox.width = rw;
    insideRegionBox.height = rh;
    return insideRegionBox;
}

/**
 * Positions one (placement, rotation) candidate into the shared {@link candidateBox} — its top-left
 * offset and its rotated footprint as width/height.
 */
function positionCandidate(
    d: PointLabelDatum,
    placement: LabelPlacement | undefined,
    rotation: number,
    width: number,
    height: number,
    gap: number,
    spacing: number
) {
    rotatedSizeInto(rotation, width, height);
    positionLabelBox(candidateBox, d, rotatedSize.width, rotatedSize.height, gap, spacing, placement);
    candidateBox.width = rotatedSize.width;
    candidateBox.height = rotatedSize.height;
}
