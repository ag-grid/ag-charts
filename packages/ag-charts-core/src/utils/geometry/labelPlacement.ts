import type { AgChartLabelOrientation, OverflowStrategy, PaddingOptions, TextWrap } from 'ag-charts-types';

import { cachedTextMeasurer, measureTextSegments } from '../../rendering/textMeasurer';
import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { Point, SizedPoint } from '../../types/scene';
import type { FontOptions } from '../../types/text';
import { toArray } from '../data/arrays';
import { toFontString, toTextString } from '../text/textUtils';
import {
    type LabelFit,
    type RegionAlign,
    findLargestFontSizeDescending,
    fitLabelTextOrOverflowAutoSize,
    fontWithSize,
    isErased,
    realCharCount,
    resolveMinimumFontSize,
} from '../text/textWrapper';
import { isArray } from '../types/typeGuards';
import { toDegrees, toRadians } from './angle';
import { type BoxBounds, boxCollides, boxContains } from './boxBounds';
import type { FitRegion } from './fitRegion';
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
    /** Reduced size the text was fitted at; `undefined` at the configured size. */
    readonly fontSize?: number;
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
    readonly minimumFontSize?: number;
}

/**
 * Resolves the label-surface fit fields to an engine {@link LabelFit}, mapping the public `truncate`
 * boolean onto the internal overflow strategy:
 *  - `truncate: true` or `defaultToTruncate` → `'ellipsis'`: the bound is applied and overflow truncates with an ellipsis.
 *  - `truncate` unset + `hideOnOverflow` → `'hide'`: the bound is applied and the label hides if it overflows.
 *  - otherwise → a fit is produced only when `wrapping` or `minimumFontSize` is set (so wrap and font
 *    reduction apply on their own); with none of the three the full text renders unbounded, as before.
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
    const { maxWidth, maxHeight, wrapping, truncate, minimumFontSize } = fit;
    let overflowStrategy: OverflowStrategy | undefined;
    if (truncate || defaultToTruncate) {
        overflowStrategy = 'ellipsis';
    } else if (hideOnOverflow) {
        overflowStrategy = 'hide';
    }
    if (overflowStrategy == null && wrapping == null && minimumFontSize == null) return undefined;
    return { maxWidth, maxHeight, wrapping, overflowStrategy, minimumFontSize };
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
    /**
     * Policy without the series' implicit container, applied when {@link policy} leaves nothing to draw.
     * Mirrors the up-front `fitLabelTextOrOverflow` fallback, so a label bound to a container too small
     * for even an ellipsis overflows it rather than being erased.
     */
    readonly fitOverflow?: LabelFit;
    /**
     * Bound the text by the datum's {@link PointLabelDatum.region} as well as by {@link policy}; defaults
     * to `true`. A bar label fits its bar rect, but a point label's region is the plotting area, which
     * contains its labels rather than truncating them.
     */
    readonly boundByRegion?: boolean;
}

/**
 * Resolves a label surface's fit policy once, returning the builder that stamps it onto each label's
 * source text. Each candidate refits that text to the room it offers, so a placement or orientation
 * able to hold the whole text is not disqualified by an earlier one's truncation. The builder yields
 * `undefined` for every text when the label opted out of overflow management.
 */
export function resolveLabelFitDescriptors(
    fit: LabelFitOptions & FontOptions,
    boxPadding: Required<PaddingOptions>,
    hideOnOverflow: boolean
) {
    const policy = resolveLabelFit(fit, hideOnOverflow);
    return (text: NormalisedTextOrSegments): LabelFitDescriptor | undefined =>
        policy == null ? undefined : { text, policy, font: fit, boxPadding };
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
    /** Shape the text is fitted to, when the candidate's container is only its bounding box. */
    readonly shape?: FitRegion;
    /** Where the block sits against {@link anchor} within that shape; defaults to centred on it. */
    readonly shapeAlign?: RegionAlign;
    /** Anchor the drawn box hangs off, so its centre can be re-derived when the fitted glyph resizes it. */
    readonly anchor: OrientationAnchor;
    /** Per-side extent of the drawn box around the glyph. */
    readonly padding: Required<PaddingOptions>;
    /** Font the text is fitted and measured with; defaults to the descriptor's own when unset. */
    readonly font?: FontOptions;
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
    /**
     * Unfitted drawn-box size at this candidate, reported in place of the datum's measured
     * {@link PointLabelDatum.label}. Set by a series whose label styler resizes the box per candidate.
     */
    readonly size?: { readonly width: number; readonly height: number };
    /** The styler disabled this label at this candidate, so the cascade skips it. */
    readonly hidden?: boolean;
}

export interface PointLabelDatum {
    readonly point: Readonly<SizedPoint>;
    /**
     * Marker diameter a `marker.itemStyler` resolved for this datum, overriding {@link point}.size
     * everywhere the marker's geometry is consulted. {@link point}.size itself stays the configured size,
     * because it is the input the styler resolved against — overwriting it would double-apply a relative
     * styler (`size: size * 2`).
     */
    readonly markerSize?: number;
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
     * Collision clearance for this label's box. Overrides the series
     * {@link SeriesLabelDefaults.threshold} when set — waterfall styles each item type separately, so
     * one series can carry several.
     */
    readonly threshold?: number;
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

/**
 * Geometry-affecting label style at one candidate placement/orientation — what a series' `itemStyler`
 * resolves to there. The engine reserves and tests this rather than the configured label, so a styler
 * that grows the label cascades to the next candidate instead of overlapping what it was placed against.
 */
export interface CandidateLabelStyle {
    readonly font: FontOptions;
    /** Per-side extent of the drawn box around the glyph (padding plus any border). */
    readonly boxPadding: Required<PaddingOptions>;
    /** The styler disabled this label; it is neither placed nor treated as an obstacle. */
    readonly hidden?: boolean;
}

/**
 * Resolves the styled geometry of one candidate. Called per `(placement × orientation)` the cascade
 * tries, short-circuited at the first candidate that fits. A datum whose series supplies a resolver must
 * also carry a {@link PointLabelDatum.fit}: it is the engine's only source of unfitted text to re-measure
 * under the styled font.
 */
export type CandidateStyleResolver = (
    datum: PointLabelDatum,
    placement: LabelPlacement | undefined,
    orientation: AgChartLabelOrientation | undefined
) => CandidateLabelStyle | undefined;

/** Per-series label placement input: the datums plus the series-level collision defaults. */
export interface SeriesLabels {
    readonly datums: readonly PointLabelDatum[];
    readonly defaults?: SeriesLabelDefaults;
    /** Set only when the series' labels are styled per datum; leaving it unset skips the styled path entirely. */
    readonly resolveCandidateStyle?: CandidateStyleResolver;
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
     * Reduced font size the text was fitted at when {@link LabelFit.minimumFontSize} let the label shrink
     * into its candidate; `undefined` when it renders at the configured size.
     */
    readonly fontSize?: number;
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
    // Strict, matching `boxCollides`: a box merely touching the circle is clear of it, not colliding.
    return dx * dx + dy * dy < r * r;
}

export function isPointLabelDatum(x: any): x is PointLabelDatum {
    return x != null && typeof x.point === 'object' && typeof x.label === 'object';
}

/** The marker diameter a label's geometry is resolved against: the styled size when there is one. */
function markerSizeOf(d: PointLabelDatum): number {
    return d.markerSize ?? d.point.size;
}

/**
 * Stamps the marker diameter a `marker.itemStyler` resolved onto a label datum, so the label's obstacles,
 * gap, anchor correction and inside-marker rect all scale off the marker that is drawn. Call only for a
 * series that has a marker styler: the cached no-styler style can carry a `hideWithSize0` zero, and
 * honouring that would move labels on existing charts that style nothing.
 */
export function applyStyledMarkerSize(datum: { markerSize?: number }, styledSize: number | undefined): void {
    // Assigned even when undefined: label data is reused across updates, so a styler that returned a size
    // on an earlier update and none now must not leave that size behind.
    datum.markerSize = styledSize;
}

/**
 * Distance from the marker to its label. A styled marker size supersedes the `gap` node data baked from the
 * configured size, so nothing has to overwrite that baked value and no stale gap can outlive a styler.
 */
function labelGapOf(d: PointLabelDatum): number {
    if (d.markerSize == null) return d.gap ?? d.point.size / 2;
    return d.markerSize > 0 ? d.markerSize / 2 : DEFAULT_MARKERLESS_LABEL_GAP;
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
 * Inside-label containment region: the bar rect inset by the {@link insideBarValueInsets} `spacing`
 * reservation on the value axis — the gap the label keeps from the end(s) it is anchored against. The
 * engine flushes and contains labels against this region, so the gap survives orientation/placement
 * resolution, not just the anchor. Collision clearance is not part of it; the engine applies
 * `collision.threshold` to every region uniformly.
 */
export function insideBarRegion(
    rect: BoxBounds,
    valueMinInset: number,
    valueMaxInset: number,
    isVertical: boolean
): BoxBounds {
    return isVertical
        ? {
              x: rect.x,
              y: rect.y + valueMinInset,
              width: rect.width,
              height: rect.height - valueMinInset - valueMaxInset,
          }
        : {
              x: rect.x + valueMinInset,
              y: rect.y,
              width: rect.width - valueMinInset - valueMaxInset,
              height: rect.height,
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

    // Half-width the wedge allows for a box of half-height `b`: bounded by the outer arc, each straight edge
    // (box extent along the edge normal <= its perpendicular distance) and, for a donut, the inner arc.
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
    /** Reduced font size that text was fitted at; `undefined` when it renders at the configured size. */
    fittedFontSize?: number;
    // Positioned-candidate writeback (placement-cascade path only): the chosen anchor and granular placement,
    // so the label renders at the winning candidate rather than the baked first one.
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
    threshold: number,
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
        threshold,
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
    threshold: number,
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
        threshold,
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
    for (const { datum, rotation, offsetX, offsetY, candidate, text, fontSize } of placed) {
        const { target, fit } = datum as BarPlacedLabelDatum;
        target.rotation = toRadians(rotation ?? 0);
        target.offsetX = offsetX ?? 0;
        target.offsetY = offsetY ?? 0;
        // The engine fitted the text to the candidate it chose, so the node must render that rather than
        // the unfitted source the datum was built from.
        target.fittedText = fit == null ? undefined : text;
        target.fittedFontSize = fit == null ? undefined : fontSize;
        // Placement-cascade path: the engine chose a whole candidate, so also retarget the label to that
        // candidate's anchor and granular placement.
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
    /** Collision clearance for this label's box, stamped onto the datum. */
    readonly threshold: number;
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
                source.threshold,
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
// Threshold-adjusted regions, all live at once: the containment region (the datum's own region or the
// shared bounds), the per-candidate marker rect, and the own region as a glyph budget.
const deflatedRegionBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
const deflatedInsideRegionBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
const fitRegionBox: BoxBounds = { x: 0, y: 0, width: 0, height: 0 };
// The candidate datum's per-category obstacle config, set before each obstacle query.
let candidateCollideWith: CollideWith | undefined;
// Collision-detection threshold applied to the candidate's own box: positive grows it (more clearance),
// negative shrinks it (tolerates overlap). Set per label before its obstacle queries.
let candidateThreshold = 0;
// The placement of the candidate being tested.
let candidatePlacement: LabelPlacement | undefined;
// Centre and radius of the candidate datum's own anchor marker, which an `inside` label is centred on and
// so never avoids. Radius disambiguates a coincident marker of a different size; -1 never matches.
let candidateOwnMarkerCx = 0;
let candidateOwnMarkerCy = 0;
let candidateOwnMarkerR = -1;
// The candidate datum's own shape rect (bar labels only): any obstacle intersecting it is excluded so an
// inside label never collides with the shape it sits on. `undefined` disables the gate.
let candidateOwnBox: BoxBounds | undefined;
// When true, `category: 'label'` obstacles overlapping `candidateOwnBox` are not excluded by the
// own-box gate (range-bar's two labels share one bar rect and must still avoid each other).
let candidateOwnBoxLabelsCollide = false;
// The label's text/box after the fit step, reused per candidate to keep the hot path allocation-free.
// `dropped` is how many characters truncation removed and `shrink` how much of the source text's area the
// glyph gave up, ranking candidates when none holds the full text at full size; `fontSize` is the
// auto-sized reduction. `maxWidth`/`maxHeight` are the glyph budget that produced it (`Infinity` when
// unbounded), which a shrink pass narrows further.
const fittedLabel: {
    text: NormalisedTextOrSegments;
    width: number;
    height: number;
    dropped: number;
    shrink: number;
    fontSize: number | undefined;
    maxWidth: number;
    maxHeight: number;
} = {
    text: '',
    width: 0,
    height: 0,
    dropped: 0,
    shrink: 0,
    fontSize: undefined,
    maxWidth: Infinity,
    maxHeight: Infinity,
};
// The fit policy bounded by the current candidate's container, refilled per candidate.
const boundedFit: {
    maxWidth?: number;
    maxHeight?: number;
    wrapping?: TextWrap;
    overflowStrategy?: OverflowStrategy;
    minimumFontSize?: number;
    region?: FitRegion;
    regionAlign?: RegionAlign;
} = {};
// Reduced font size the candidate being tested was fitted at, `undefined` at the configured size. Read
// by `recordBestChoice` rather than threaded through it as one more positional argument.
let candidateFontSize: number | undefined;
// Size the collision-shrink search is currently re-running the cascade at, `undefined` outside a trial.
let candidateTrialFontSize: number | undefined;
// The candidate font at the trial size, refilled per candidate while a trial is running.
const trialFont: FontOptions = { fontSize: 0 };

/**
 * `font` resized to the size the collision-shrink search is trialling, or `font` itself outside a trial.
 * The ladder runs from the configured size, so a trial above a size an `itemStyler` resolved lower is
 * clamped back to it; only the size is overridden, keeping the family and weight the styler chose.
 */
function candidateFontAt(font: FontOptions): FontOptions {
    if (candidateTrialFontSize == null || candidateTrialFontSize >= font.fontSize) return font;
    trialFont.fontSize = candidateTrialFontSize;
    trialFont.fontStyle = font.fontStyle;
    trialFont.fontWeight = font.fontWeight;
    trialFont.fontFamily = font.fontFamily;
    return trialFont;
}
// Per-datum inputs to `cascadeCandidates`, refilled by `placeAvoidingLabel` before it runs. Held here
// rather than passed so the cascade can be re-run without allocating a closure or an argument list.
let cascadeDatum: PointLabelDatum;
let cascadeIndex = 0;
let cascadePlacements: readonly LabelPlacement[] | undefined;
let cascadeOrientations: AgChartLabelOrientation[] | undefined;
let cascadeSingleOrientation: AgChartLabelOrientation | undefined;
let cascadeStyle: CandidateStyleResolver | undefined;
let cascadeFitSource: { width: number; height: number } | undefined;
let cascadeGap = 0;
let cascadeSpacing = 0;
let cascadeInflate = 0;
let cascadeThreshold = 0;
let cascadeContainThreshold = 0;
let cascadeRawRegion: BoxBounds;
let cascadeRegion: BoxBounds;
let cascadeFitRegion: BoxBounds | undefined;
let cascadeFlushToRegion = false;
let cascadeKeepBest = false;
// Glyph budget of the candidate being fitted, refilled per candidate on the compass path.
const candidateContainer = { width: 0, height: 0 };
// The datum's source text measured under one candidate font, keyed by that font, so the common case of one
// font per datum measures once. The key is cleared at the start of each datum's cascade.
const styledSource = { width: 0, height: 0 };
let styledSourceFont = '';
// Drawn-box centre of a positioned candidate whose box a re-fit resized.
const boxCentre: Point = { x: 0, y: 0 };
// Rotated axis-aligned footprint, written per candidate to keep the rotation loop allocation-free.
const rotatedSize = { width: 0, height: 0 };

// OPTIMIZATION: allocation-free variant of getMinOuterRectSize for the candidate hot loop, writing
// into the shared `rotatedSize` scratch and short-circuiting the unrotated case.
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

/**
 * How much of the collision threshold a containment region takes: only the negative part, which is spill
 * allowance — the label may overflow the region by that much without counting as a collision. A positive
 * threshold must not inset a containment region, because the label is flushed against that region's raw
 * edge and an inset bound could then only ever reject it. Positive clearance is the glyph budget's job
 * ({@link deflateContainer}), not containment's.
 */
function containmentThreshold(threshold: number): number {
    return Math.min(threshold, 0);
}

// Insetting the region by the threshold is the same predicate as inflating the box by it, and the
// region form is what the least-overflow ranking can share.
function deflateRegion(dest: BoxBounds, src: BoxBounds, threshold: number): BoxBounds {
    if (threshold === 0) return src;
    dest.x = src.x + threshold;
    dest.y = src.y + threshold;
    dest.width = Math.max(0, src.width - 2 * threshold);
    dest.height = Math.max(0, src.height - 2 * threshold);
    return dest;
}

// The only way a positive threshold reaches an own shape: text wraps or truncates to the clearance it
// must keep, rather than the box moving to make room.
function deflateContainer(container: { width: number; height: number } | undefined, threshold: number) {
    if (container == null || threshold === 0) return container;
    candidateContainer.width = Math.max(0, container.width - 2 * threshold);
    candidateContainer.height = Math.max(0, container.height - 2 * threshold);
    return candidateContainer;
}

/** A maximum rather than a sum, so an obstacle spanning several index cells needs no de-duplicating. */
let candidateWorstOverlap = 0;

/** Approximates a circle by its box: this only orders candidates, it does not decide whether they collide. */
function worstObstacleOverlap(o: LabelObstacle): void {
    if (!obstacleOverlapsCandidate(o)) return;
    const { x, y, width, height } = candidateBox;
    const overlapWidth = Math.min(x + width, o.box.x + o.box.width) - Math.max(x, o.box.x);
    const overlapHeight = Math.min(y + height, o.box.y + o.box.height) - Math.max(y, o.box.y);
    if (overlapWidth > 0 && overlapHeight > 0) {
        candidateWorstOverlap = Math.max(candidateWorstOverlap, overlapWidth * overlapHeight);
    }
}

/** True when `o` is one of the obstacles the candidate is allowed to sit on, so no test applies to it. */
function obstacleExcluded(o: LabelObstacle): boolean {
    const category = o.category ?? 'seriesItem';
    // An `inside` label is centred on its own anchor marker, so it can never be said to avoid it;
    // directional labels fall through to the circle test, which measures their real clearance.
    if (
        candidatePlacement === 'inside' &&
        category === 'marker' &&
        o.kind === 'circle' &&
        o.cx === candidateOwnMarkerCx &&
        o.cy === candidateOwnMarkerCy &&
        o.r === candidateOwnMarkerR
    ) {
        return true;
    }

    // An inside label never collides with the shape it sits on, so anything overlapping its own box is
    // excluded; `ownBoxLabelsCollide` opts sibling labels back in (range-bar shares one bar rect).
    if (
        candidateOwnBox != null &&
        !(candidateOwnBoxLabelsCollide && category === 'label') &&
        boxCollides(o.box, candidateOwnBox.x, candidateOwnBox.y, candidateOwnBox.width, candidateOwnBox.height)
    ) {
        return true;
    }

    return candidateCollideWith?.[category] === false;
}

/**
 * The box obstacles are tested against: the candidate box grown (positive threshold) or shrunk (negative)
 * by the collision threshold. `undefined` when a negative threshold collapses it past its own extent,
 * meaning the label tolerates any overlap rather than testing an inverted box.
 */
function candidateTestBox(): BoxBounds | undefined {
    // No inflation (the common case, threshold 0): test the candidate box directly.
    if (candidateThreshold === 0) return candidateBox;
    inflateBoxInto(inflatedBox, candidateBox, candidateThreshold);
    if (inflatedBox.width <= 0 || inflatedBox.height <= 0) return undefined;
    return inflatedBox;
}

function obstacleOverlapsBox(o: LabelObstacle, testBox: BoxBounds): boolean {
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

function obstacleOverlapsCandidate(o: LabelObstacle): boolean {
    if (obstacleExcluded(o)) return false;
    const testBox = candidateTestBox();
    return testBox != null && obstacleOverlapsBox(o, testBox);
}

// Per-axis reduction of the candidate box that would take it clear of the obstacles it hits, written by
// `measureObstacleReduction`. `Infinity` on an axis whose obstacles no amount of shrinking can clear.
const shrinkReduction = { width: 0, height: 0 };
// Cost of retreating one side of the candidate box past an obstacle, per pixel of intrusion: 1 when a
// shrink moves that side, 2 when the box is centred on its anchor (each side takes half the reduction),
// and Infinity when the side is pinned and a shrink cannot move it at all.
let pinCostLeft = 1;
let pinCostRight = 1;
let pinCostTop = 1;
let pinCostBottom = 1;

// `pin` is which edge of the box stays put as it shrinks: positive the min edge (left/top), negative the
// max edge (right/bottom), zero neither — the box is centred and both edges retreat by half.
function sideCost(pin: number, isMinEdge: boolean): number {
    if (pin === 0) return 2;
    return pin > 0 === isMinEdge ? Infinity : 1;
}

// Never returns a verdict: unlike the collision test this visits every obstacle, since the reduction has
// to answer all of them.
function accumulateObstacleReduction(o: LabelObstacle): void {
    if (obstacleExcluded(o)) return;
    const testBox = candidateTestBox();
    if (testBox == null || !obstacleOverlapsBox(o, testBox)) return;
    // Every obstacle is cleared by retreating one side of the box past it, so the obstacle costs the
    // cheapest of those four retreats. A circle or custom shape is measured by its AABB, overstating the
    // retreat it needs; the caller re-tests the shrunk candidate, so an approximate budget stays safe.
    const { box } = o;
    const left = pinCostLeft * (box.x + box.width - testBox.x);
    const right = pinCostRight * (testBox.x + testBox.width - box.x);
    const top = pinCostTop * (box.y + box.height - testBox.y);
    const bottom = pinCostBottom * (testBox.y + testBox.height - box.y);
    const horizontal = Math.min(left, right);
    const vertical = Math.min(top, bottom);
    // Cheapest is a fraction of the extent it comes out of, not a pixel count: an obstacle spanning the
    // label's whole height is cleared by a few px of height and half its width, but those few px are all the
    // height there is. An obstacle sits in every grid cell it spans, so this visitor can see it more than
    // once: accumulating with `max` keeps the measurement idempotent.
    if (horizontal / testBox.width <= vertical / testBox.height) {
        shrinkReduction.width = Math.max(shrinkReduction.width, horizontal);
    } else {
        shrinkReduction.height = Math.max(shrinkReduction.height, vertical);
    }
}

/**
 * Measures how far the candidate box has to shrink to clear the obstacles it hits, into {@link
 * shrinkReduction}. `false` when shrinking cannot clear them at all: either nothing intrudes, or what does
 * intrudes from a side the box is pinned to.
 */
function measureObstacleReduction(pinX: number, pinY: number, inflate: number): boolean {
    shrinkReduction.width = 0;
    shrinkReduction.height = 0;
    inflateBoxInto(queryBox, candidateBox, inflate);
    pinCostLeft = sideCost(pinX, true);
    pinCostRight = sideCost(pinX, false);
    pinCostTop = sideCost(pinY, true);
    pinCostBottom = sideCost(pinY, false);
    obstacleIndex.query(queryBox, accumulateObstacleReduction);
    const { width, height } = shrinkReduction;
    if (width === Infinity || height === Infinity) return false;
    return width > 0 || height > 0;
}

/** Cell size for the obstacle index, derived from the mean extent of every box it will hold. */
function obstacleGridCellSize(data: Map<string, SeriesLabels>, obstacles: readonly LabelObstacle[]): number {
    let extentSum = 0;
    let extentCount = 0;
    for (const { datums } of data.values()) {
        for (const d of datums) {
            extentSum += d.label.width + d.label.height;
            extentCount += 2;
            const markerSize = markerSizeOf(d);
            if (markerSize > 0) {
                extentSum += markerSize;
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
    const { x, y } = d.point;
    const size = markerSizeOf(d);
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
            const size = markerSizeOf(d);
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
 * building it is wasted work (see {@link placeLabels}). A label that opted into overflow control is not
 * sole-candidate: it has a second answer to an obstacle beyond moving, which is to shrink into the room
 * the obstacle leaves.
 */
function isSoleCandidateKeep(d: PointLabelDatum, defaults: SeriesLabelDefaults | undefined): boolean {
    const alwaysShow = d.alwaysShow ?? defaults?.alwaysShow ?? true;
    if (!alwaysShow || d.positionedCandidates != null || d.neverDrop === true || d.fit != null) return false;
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
            {
                datums: entry.datums.toSorted((a, b) => markerSizeOf(b) - markerSizeOf(a)),
                defaults: entry.defaults,
                resolveCandidateStyle: entry.resolveCandidateStyle,
            },
        ])
    );

    // Common keep-only case (line/area/bar with a single placement): no label queries the index, so
    // building it and seeding it with obstacles is wasted work.
    const useIndex = !noLabelQueriesIndex(placementData);
    if (useIndex) {
        buildObstacleIndex(placementData, obstacles, bounds);
    }

    let labelObstacleCount = 0;
    for (const [seriesId, { datums, defaults, resolveCandidateStyle }] of orderKeepFirst(placementData)) {
        const labels: PlacedLabel[] = [];
        if (!datums[0]?.label) continue;
        for (let index = 0, ln = datums.length; index < ln; index++) {
            const d = datums[index];
            // Series emit a datum per point; unlabelled points measure to an empty box. Skip them so
            // they neither occupy a placement nor act as obstacles against labels that do have text.
            if (d.label.text === '') continue;
            const placed = tryPlaceLabel(d, defaults, index, padding, bounds, resolveCandidateStyle);
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
    const markerSize = markerSizeOf(d);
    if (anchor) {
        x -= (anchor.x - 0.5) * markerSize;
        y -= (anchor.y - 0.5) * markerSize;
    }
    if (placement === 'inside' && d.insideOffset) {
        x += d.insideOffset.x * markerSize;
        y += d.insideOffset.y * markerSize;
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
    font: FontOptions,
    source: { width: number; height: number } | undefined,
    container: { width: number; height: number } | undefined,
    candidateRegion?: FitRegion,
    candidateRegionAlign?: RegionAlign
) {
    const { text, policy } = fit;
    const maxWidth = Math.min(policy.maxWidth ?? Infinity, container?.width ?? Infinity);
    const maxHeight = Math.min(policy.maxHeight ?? Infinity, container?.height ?? Infinity);
    const full = source ?? measureLabelText(text, font);
    fittedLabel.maxWidth = maxWidth;
    fittedLabel.maxHeight = maxHeight;
    // A candidate carrying its own shape overrides the policy's; a datum bounded by a shape (a label
    // inside a marker outline) keeps it across every candidate, so a re-fit is never looser than the
    // up-front measurement was.
    const region = candidateRegion ?? policy.region;
    const regionAlign = candidateRegionAlign ?? policy.regionAlign;
    // A shape can be narrower than its bounding box anywhere the text lands, so the whole-text shortcut
    // is only sound for a rectangular bound.
    if (region == null && full.width <= maxWidth && full.height <= maxHeight) {
        fittedLabel.text = text;
        fittedLabel.width = full.width;
        fittedLabel.height = full.height;
        fittedLabel.dropped = 0;
        fittedLabel.shrink = 0;
        fittedLabel.fontSize = undefined;
        return true;
    }

    boundedFit.maxWidth = maxWidth === Infinity ? undefined : maxWidth;
    boundedFit.maxHeight = maxHeight === Infinity ? undefined : maxHeight;
    boundedFit.wrapping = policy.wrapping;
    boundedFit.overflowStrategy = policy.overflowStrategy;
    // A trial already owns the size, so the inner search must not run a second one inside it.
    boundedFit.minimumFontSize = candidateTrialFontSize == null ? policy.minimumFontSize : undefined;
    boundedFit.region = region;
    boundedFit.regionAlign = regionAlign;
    const { text: fitted, fontSize } = fitLabelTextOrOverflowAutoSize(text, boundedFit, fit.fitOverflow, font);
    // `overflowStrategy: 'hide'` empties the text rather than truncating it; the candidate cannot show
    // this label at all, so the cascade must move on rather than place an empty box.
    if (isErased(fitted)) return false;

    // A shrunk label reserves the box its reduced glyph occupies, which is also what lets it clear an
    // obstacle the full-size one collided with.
    const size = measureLabelText(fitted, fontWithSize(font, fontSize));
    fittedLabel.text = fitted;
    fittedLabel.width = size.width;
    fittedLabel.height = size.height;
    fittedLabel.dropped = Math.max(0, textLength(text) - textLength(fitted));
    fittedLabel.shrink = shrinkRatio(size, full);
    fittedLabel.fontSize = fontSize;
    return true;
}

/**
 * How much of the source text's area a fitted glyph gave up, in `[0, 1)`. Kept below `1` so that any
 * amount of shrinking still ranks ahead of losing a single character (see {@link recordBestChoice}), and
 * `0` for a glyph that wrapping made no smaller — growing taller is not a better fit than staying put.
 */
function shrinkRatio(fitted: { width: number; height: number }, full: { width: number; height: number }): number {
    const fullArea = full.width * full.height;
    if (fullArea <= 0) return 0;
    const ratio = 1 - (fitted.width * fitted.height) / fullArea;
    return ratio <= 0 ? 0 : Math.min(ratio, MAX_SHRINK_SCORE);
}

/**
 * The glyph budget a compass-path candidate offers: the datum's region minus the drawn box, with the
 * axes swapped for a rotated candidate (its glyph width runs along the region's height). `undefined`
 * when the datum has no region, leaving the candidate bound only by the fit policy.
 */
function compassCandidateContainer(
    region: BoxBounds | undefined,
    pad: Required<PaddingOptions> | undefined,
    rotation: number
) {
    if (region == null) return undefined;
    const upright = rotation % 180 === 0;
    const width = upright ? region.width : region.height;
    const height = upright ? region.height : region.width;
    candidateContainer.width = Math.max(0, width - (pad == null ? 0 : pad.left + pad.right));
    candidateContainer.height = Math.max(0, height - (pad == null ? 0 : pad.top + pad.bottom));
    return candidateContainer;
}

/**
 * The glyph budget an `inside` candidate offers: the marker inscribed rect {@link insideRegionFor} contains
 * it by, minus the drawn box. Fitting to it is what lets a label too large for its marker truncate into it
 * as a last resort; the truncation keeps the candidate out of the immediate-return path, so a directional
 * placement that holds the whole text still wins the cascade. `undefined` for every other candidate.
 */
function insideMarkerContainer(
    d: PointLabelDatum,
    placement: LabelPlacement | undefined,
    pad: Required<PaddingOptions> | undefined,
    rotation: number,
    threshold: number
) {
    if (placement !== 'inside' || d.insideSize == null) return undefined;
    const markerSize = markerSizeOf(d);
    const upright = rotation % 180 === 0;
    const width = (upright ? d.insideSize.width : d.insideSize.height) * markerSize;
    const height = (upright ? d.insideSize.height : d.insideSize.width) * markerSize;
    candidateContainer.width = Math.max(0, width - boxWidthOf(pad) - 2 * threshold);
    candidateContainer.height = Math.max(0, height - boxHeightOf(pad) - 2 * threshold);
    return candidateContainer;
}

/** The datum's source text measured under `font`, reused for as long as the candidate font is unchanged. */
function styledFitSource(fit: LabelFitDescriptor, font: FontOptions) {
    const key = toFontString(font);
    if (key !== styledSourceFont) {
        const { width, height } = measureLabelText(fit.text, font);
        styledSource.width = width;
        styledSource.height = height;
        styledSourceFont = key;
    }
    return styledSource;
}

// Drawn-box size of the candidate being tested, written by `sizeCandidateLabel`. `width`/`height` are the
// drawn box, `glyphWidth`/`glyphHeight` the text inside it and `maxWidth`/`maxHeight` the budget it was
// fitted to, which the obstacle-shrink pass narrows.
const candidateLabel: {
    text: NormalisedTextOrSegments;
    width: number;
    height: number;
    dropped: number;
    shrink: number;
    glyphWidth: number;
    glyphHeight: number;
    maxWidth: number;
    maxHeight: number;
} = {
    text: '',
    width: 0,
    height: 0,
    dropped: 0,
    shrink: 0,
    glyphWidth: 0,
    glyphHeight: 0,
    maxWidth: Infinity,
    maxHeight: Infinity,
};

/**
 * Sizes one candidate's drawn box into {@link candidateLabel}: the source text refitted to the room this
 * candidate offers, inflated by the box drawn around it. A `style` substitutes the font and box extent the
 * series' styler resolved at this candidate for the configured ones, so the reservation matches what will
 * be drawn there. `false` when the fit policy leaves nothing to draw, which disqualifies the candidate.
 */
function sizeCandidateLabel(
    d: PointLabelDatum,
    style: CandidateLabelStyle | undefined,
    placement: LabelPlacement | undefined,
    rotation: number,
    threshold: number,
    fitRegion: BoxBounds | undefined,
    fitSource: { width: number; height: number } | undefined
): boolean {
    const { fit } = d;
    candidateFontSize = undefined;
    if (fit == null) {
        candidateLabel.text = d.label.text;
        candidateLabel.width = d.label.width;
        candidateLabel.height = d.label.height;
        candidateLabel.glyphWidth = d.label.width;
        candidateLabel.glyphHeight = d.label.height;
        candidateLabel.dropped = 0;
        candidateLabel.shrink = 0;
        candidateLabel.maxWidth = Infinity;
        candidateLabel.maxHeight = Infinity;
        return true;
    }
    const font = candidateFontAt(style?.font ?? fit.font);
    const boxPadding = style?.boxPadding ?? fit.boxPadding;
    const container =
        insideMarkerContainer(d, placement, boxPadding, rotation, threshold) ??
        (fit.boundByRegion === false ? undefined : compassCandidateContainer(fitRegion, boxPadding, rotation));
    // A styled or trialled candidate re-measures the source under its own font; an unstyled one at the
    // configured size shares the cascade's single measurement.
    const source = style == null && candidateTrialFontSize == null ? fitSource : styledFitSource(fit, font);
    if (!fitLabelToCandidate(fit, font, source, container)) return false;
    writeCandidateLabel(boxPadding, font);
    return true;
}

/**
 * Copies the fit result into {@link candidateLabel}, inflated by the box drawn around the glyph, and into
 * {@link candidateFontSize} for {@link recordBestChoice} to read back.
 */
function writeCandidateLabel(boxPadding: Required<PaddingOptions> | undefined, font: FontOptions) {
    candidateLabel.text = fittedLabel.text;
    candidateLabel.glyphWidth = fittedLabel.width;
    candidateLabel.glyphHeight = fittedLabel.height;
    candidateLabel.width = fittedLabel.width + boxWidthOf(boxPadding);
    candidateLabel.height = fittedLabel.height + boxHeightOf(boxPadding);
    candidateLabel.dropped = fittedLabel.dropped;
    candidateLabel.shrink = fittedLabel.shrink;
    candidateLabel.maxWidth = fittedLabel.maxWidth;
    candidateLabel.maxHeight = fittedLabel.maxHeight;
    // Text that already fits reports no size of its own, so a trial's size comes from the font it ran at
    // — which is the trial size, or the styler-resolved one when the trial was clamped back to it.
    candidateFontSize = fittedLabel.fontSize ?? (candidateTrialFontSize == null ? undefined : font.fontSize);
}

// Glyph budget of the candidate being re-fitted to the room its obstacles leave.
const shrunkContainer = { width: 0, height: 0 };
// Flush offset a shrink pass' repositioning produced, read back by the cascade that records the candidate.
const shrunkOffset: Point = { x: 0, y: 0 };

function reduceAxis(budget: number, extent: number, reduce: number): number {
    return reduce > 0 ? Math.max(0, Math.min(budget, extent - reduce)) : budget;
}

/**
 * Re-fits the candidate's text into its own glyph budget reduced by {@link shrinkReduction}, writing the
 * result into {@link candidateLabel}. `false` when the reduced budget leaves no real character to draw, so
 * the label falls back to overlapping or hiding rather than rendering a bare ellipsis.
 */
function refitCandidateShrunk(
    fit: LabelFitDescriptor,
    font: FontOptions,
    source: { width: number; height: number } | undefined,
    boxPadding: Required<PaddingOptions> | undefined,
    reduceWidth: number,
    reduceHeight: number
): boolean {
    // Only the reduced axis is bound to what the glyph currently occupies: pinning the other to its current
    // extent as well would forbid the wrap that trades width for height.
    shrunkContainer.width = reduceAxis(candidateLabel.maxWidth, candidateLabel.glyphWidth, reduceWidth);
    shrunkContainer.height = reduceAxis(candidateLabel.maxHeight, candidateLabel.glyphHeight, reduceHeight);
    if (!fitLabelToCandidate(fit, font, source, shrunkContainer)) return false;
    if (realCharCount(fittedLabel.text) < MIN_FITTED_CHARS) return false;
    writeCandidateLabel(boxPadding, font);
    return true;
}

/**
 * Slides the shrunk candidate flush inside `rawRegion` when its placement is region-bound, recording the
 * translation in {@link shrunkOffset} for the caller to hand back to the series.
 */
function flushShrunkCandidate(rawRegion: BoxBounds, flush: boolean) {
    shrunkOffset.x = 0;
    shrunkOffset.y = 0;
    if (!flush) return;
    const { x, y, width, height } = candidateBox;
    candidateBox.x = clampAxis(x, width, rawRegion.x, rawRegion.width);
    candidateBox.y = clampAxis(y, height, rawRegion.y, rawRegion.height);
    shrunkOffset.x = candidateBox.x - x;
    shrunkOffset.y = candidateBox.y - y;
}

/** Containment and obstacle re-test of the candidate a shrink pass just resized and repositioned. */
function shrunkCandidateIsClear(region: BoxBounds, inflate: number): boolean {
    const { x, y, width, height } = candidateBox;
    if (!boxContains(region, x, y, width, height)) return false;
    inflateBoxInto(queryBox, candidateBox, inflate);
    return !obstacleIndex.query(queryBox, obstacleOverlapsCandidate);
}

/**
 * Second chance for a compass candidate that fits its region but hits an obstacle: the text is re-fitted to
 * the room the obstacles leave, and the candidate repositioned and re-tested. `true` leaves the shrunk
 * candidate in {@link candidateLabel}/{@link candidateBox} for the caller to record — a candidate that only
 * clears its obstacles by giving up text or size is a fallback, never the cascade's outright answer, so
 * a later placement that needs no compromise still wins.
 *
 * One attempt only: wrapping trades width for height, so the reduction is a budget rather than a solution,
 * and the re-test is what keeps an approximate budget safe.
 */
function shrinkCompassCandidate(
    d: PointLabelDatum,
    style: CandidateLabelStyle | undefined,
    placement: LabelPlacement | undefined,
    rotation: number,
    gap: number,
    spacing: number,
    fitSource: { width: number; height: number } | undefined,
    rawRegion: BoxBounds,
    region: BoxBounds,
    containThreshold: number,
    inflate: number,
    flushToRegion: boolean
): boolean {
    const fit = d.fit;
    if (fit == null) return false;
    // Which edges the box keeps as it shrinks, mirroring how `positionLabelBox` hangs it off the point: a
    // directional candidate is pinned to the edge facing the point, a gapless or `inside` one stays centred.
    const vec = gap > 0 && placement != null ? labelPlacements[placement] : undefined;
    if (!measureObstacleReduction(vec?.x ?? 0, vec?.y ?? 0, inflate)) return false;
    // The reduction is measured on the rotated footprint, whose axes are the glyph's swapped for a
    // quarter-turned candidate.
    const upright = rotation % 180 === 0;
    const font = candidateFontAt(style?.font ?? fit.font);
    const source = style == null && candidateTrialFontSize == null ? fitSource : styledFitSource(fit, font);
    const reduceWidth = upright ? shrinkReduction.width : shrinkReduction.height;
    const reduceHeight = upright ? shrinkReduction.height : shrinkReduction.width;
    if (!refitCandidateShrunk(fit, font, source, style?.boxPadding ?? fit.boxPadding, reduceWidth, reduceHeight)) {
        return false;
    }
    positionCandidate(d, placement, rotation, candidateLabel.width, candidateLabel.height, gap, spacing);
    flushShrunkCandidate(rawRegion, flushToRegion);
    const { x, y, width, height } = candidateBox;
    const insideRegion = insideRegionFor(d, placement, x, y, width, height);
    const containRegion =
        insideRegion == null ? region : deflateRegion(deflatedInsideRegionBox, insideRegion, containThreshold);
    return shrunkCandidateIsClear(containRegion, inflate);
}

/** Which edge of a positioned candidate's box stays put as it shrinks; see {@link sideCost}. */
function anchorPinX(anchor: OrientationAnchor): number {
    if (anchor.textAlign === 'left' || anchor.textAlign === 'start') return 1;
    if (anchor.textAlign === 'right' || anchor.textAlign === 'end') return -1;
    return 0;
}

function anchorPinY(anchor: OrientationAnchor): number {
    if (anchor.textBaseline === 'top') return 1;
    if (anchor.textBaseline === 'bottom') return -1;
    return 0;
}

/**
 * {@link shrinkCompassCandidate} for the positioned-candidate path, where the box hangs off `fitTo.anchor`
 * rather than off a placement vector. Skips a rotated candidate: its anchor pins the glyph box, whose axes
 * a rotation does not share with the footprint the obstacles were measured against.
 */
function shrinkPositionedCandidate(
    d: PointLabelDatum,
    c: PositionedLabelCandidate,
    fitSource: { width: number; height: number } | undefined,
    rawRegion: BoxBounds,
    region: BoxBounds,
    inflate: number
): boolean {
    const fit = d.fit;
    const fitTo = c.fitTo;
    if (fit == null || fitTo == null || (c.rotation ?? 0) % 360 !== 0) return false;
    if (!measureObstacleReduction(anchorPinX(fitTo.anchor), anchorPinY(fitTo.anchor), inflate)) return false;
    const styledFont = fitTo.font;
    const source = styledFont == null ? fitSource : styledFitSource(fit, styledFont);
    const { width, height } = shrinkReduction;
    if (!refitCandidateShrunk(fit, styledFont ?? fit.font, source, fitTo.padding, width, height)) return false;
    resizeCandidateBox(c, candidateLabel.width, candidateLabel.height);
    flushShrunkCandidate(rawRegion, c.region != null && c.flushToRegion !== false);
    return shrunkCandidateIsClear(region, inflate);
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
    bounds: BoxBounds,
    resolveCandidateStyle: CandidateStyleResolver | undefined
): PlacedLabel | undefined {
    // A datum's own field overrides the series default; when neither is set the label is kept.
    const alwaysShow = d.alwaysShow ?? defaults?.alwaysShow ?? true;
    const placements = d.placements ?? defaults?.placements;
    const collideWith = d.collideWith ?? defaults?.collideWith;
    const gap = labelGapOf(d);
    const spacing = d.spacing ?? defaults?.spacing ?? padding;
    const threshold = d.threshold ?? defaults?.threshold ?? 0;

    // Sole-candidate keep-forever: one placement, kept on overflow, never dropped. The obstacle query
    // could only ever return this same placement, so skip it and take the placement unconditionally.
    if (isSoleCandidateKeep(d, defaults)) {
        const placement = candidateAt(placements, d.placement, 0);
        const orientation = candidateAt(orientationsOf(d), singleOrientationOf(d), 0);
        const rotation = orientation == null ? 0 : orientationAngles[orientation];
        styledSourceFont = '';
        const style = resolveCandidateStyle?.(d, placement, orientation);
        if (style?.hidden === true) return undefined;
        if (!sizeCandidateLabel(d, style, placement, rotation, threshold, d.region, undefined)) return undefined;
        const { text, width, height } = candidateLabel;
        positionCandidate(d, placement, rotation, width, height, gap, spacing);
        const { x, y } = candidateBox;
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
            fontSize: candidateFontSize,
        };
    }

    return placeAvoidingLabel(
        d,
        placements,
        collideWith,
        alwaysShow,
        index,
        bounds,
        gap,
        spacing,
        threshold,
        resolveCandidateStyle
    );
}

/** Total horizontal extent the drawn box adds around the glyph. */
function boxWidthOf(pad: Required<PaddingOptions> | undefined): number {
    return pad == null ? 0 : pad.left + pad.right;
}

/** Total vertical extent the drawn box adds around the glyph. */
function boxHeightOf(pad: Required<PaddingOptions> | undefined): number {
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
    fontSize: number | undefined;
}

/**
 * Tier of a candidate that fits its region and clears every obstacle, but only by wrapping, shrinking or
 * truncating its text. Scored `dropped + shrink`: every character lost costs a whole point and shrinking
 * less than one, so the least-truncated candidate wins and, among equally truncated ones, the least shrunk.
 */
const TIER_FIT = 0;
/** Tier of a candidate that fits its region but hits an obstacle, scored by how much of it is buried. */
const TIER_COLLIDING = 1;
/** Tier of a candidate that overflows its region; kept only to avoid dropping the label. */
const TIER_OVERFLOWING = 2;
/** Upper bound on {@link shrinkRatio}, keeping any amount of shrinking cheaper than losing one character. */
const MAX_SHRINK_SCORE = 0.999;
/** Real characters a shrunk candidate must still show; below it the budget renders a bare ellipsis. */
const MIN_FITTED_CHARS = 1;

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
    fontSize: undefined,
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
    bestChoice.fontSize = candidateFontSize;
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
        fontSize: bestChoice.fontSize,
    };
}

/**
 * One pass over the `(placement × orientation)` candidates set up on the `cascade*` scratch, returning the
 * first whose rotated box holds the whole text, fits its region and clears every obstacle in the index.
 * Candidates that only fit by truncating, and (for a kept label) those that overflow or collide, are
 * recorded against {@link bestChoice} instead, leaving `undefined` for the caller to resolve.
 */
function cascadeCandidates(): PlacedLabel | undefined {
    const d = cascadeDatum;
    const candidateCount = cascadePlacements?.length ?? 1;
    const orientationCount = cascadeOrientations?.length ?? 1;
    // A trial can only win outright, so it records nothing: a label that never places cleanly falls back
    // to the candidate it would have fallen back to at the configured size, whatever sizes were tried.
    const recordBest = candidateTrialFontSize == null;
    for (let pi = 0; pi < candidateCount; pi++) {
        const placement = candidateAt(cascadePlacements, d.placement, pi);
        for (let oi = 0; oi < orientationCount; oi++) {
            const orientation = candidateAt(cascadeOrientations, cascadeSingleOrientation, oi);
            const rotation = orientation == null ? 0 : orientationAngles[orientation];
            // A label disabled at every candidate is dropped entirely: unplaced, it never enters the
            // obstacle index, so it reserves no space from its neighbours.
            const style = cascadeStyle?.(d, placement, orientation);
            if (style?.hidden === true) continue;
            if (
                !sizeCandidateLabel(d, style, placement, rotation, cascadeThreshold, cascadeFitRegion, cascadeFitSource)
            ) {
                continue;
            }
            const { text, width, height, dropped, shrink } = candidateLabel;
            positionCandidate(d, placement, rotation, width, height, cascadeGap, cascadeSpacing);
            let { x, y } = candidateBox;
            const { width: cw, height: ch } = candidateBox;
            let offsetX = 0;
            let offsetY = 0;
            if (cascadeFlushToRegion) {
                const nx = clampAxis(x, cw, cascadeRawRegion.x, cascadeRawRegion.width);
                const ny = clampAxis(y, ch, cascadeRawRegion.y, cascadeRawRegion.height);
                offsetX = nx - x;
                offsetY = ny - y;
                candidateBox.x = x = nx;
                candidateBox.y = y = ny;
            }
            candidatePlacement = placement;
            const insideRegion = insideRegionFor(d, placement, x, y, cw, ch);
            const containRegion =
                insideRegion == null
                    ? cascadeRegion
                    : deflateRegion(deflatedInsideRegionBox, insideRegion, cascadeContainThreshold);
            inflateBoxInto(queryBox, candidateBox, cascadeInflate);
            const contained = boxContains(containRegion, x, y, cw, ch);
            if (contained && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
                if (dropped === 0) {
                    return {
                        index: cascadeIndex,
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
                        fontSize: candidateFontSize,
                    };
                }
                if (recordBest) {
                    recordBestChoice(
                        TIER_FIT,
                        dropped + shrink,
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
                continue;
            }
            if (cascadeKeepBest && recordBest) {
                const overflow = regionOverflow(containRegion, x, y, cw, ch);
                let tier = TIER_OVERFLOWING;
                let score = overflow;
                if (overflow === 0) {
                    candidateWorstOverlap = 0;
                    obstacleIndex.query(queryBox, worstObstacleOverlap);
                    tier = TIER_COLLIDING;
                    score = candidateWorstOverlap;
                }
                recordBestChoice(tier, score, text, width, height, rotation, offsetX, offsetY, placement, undefined);
            }
            // Obstacle-only failure: the candidate has the room, an obstacle is taking part of it. Shrinking
            // is tried last so a failed attempt can clobber the shared candidate scratch freely, and only
            // outside a trial, whose candidates can win outright but record nothing.
            if (
                contained &&
                recordBest &&
                shrinkCompassCandidate(
                    d,
                    style,
                    placement,
                    rotation,
                    cascadeGap,
                    cascadeSpacing,
                    cascadeFitSource,
                    cascadeRawRegion,
                    cascadeRegion,
                    cascadeContainThreshold,
                    cascadeInflate,
                    cascadeFlushToRegion
                )
            ) {
                recordBestChoice(
                    TIER_FIT,
                    candidateLabel.dropped + candidateLabel.shrink,
                    candidateLabel.text,
                    candidateLabel.width,
                    candidateLabel.height,
                    rotation,
                    shrunkOffset.x,
                    shrunkOffset.y,
                    placement,
                    undefined
                );
            }
        }
    }
    return undefined;
}

/**
 * Re-runs the cascade at reduced font sizes, returning the largest at which some candidate places
 * cleanly. Reached only once every placement has failed at the configured size, so a label shrinks after
 * exhausting its placement fallbacks and before it is hidden or falls back to a colliding candidate.
 * `undefined` when the label cannot shrink or no size clears.
 */
function shrinkToClear(): PlacedLabel | undefined {
    const { fit } = cascadeDatum;
    const minimumFontSize = fit?.policy.minimumFontSize;
    if (fit == null || minimumFontSize == null) return undefined;
    const { fontSize } = fit.font;
    const floor = resolveMinimumFontSize(minimumFontSize, fontSize);
    if (floor >= fontSize) return undefined;

    try {
        // A smaller font can reflow the text into a wider box, so clearance is not monotonic in the size
        // and the ladder has to be walked down rather than bisected.
        return findLargestFontSizeDescending(floor, fontSize, function trialFontSize(size) {
            candidateTrialFontSize = size;
            return cascadeCandidates();
        });
    } finally {
        // A styler throwing mid-trial would otherwise leave every later label sized at the trial size.
        candidateTrialFontSize = undefined;
    }
}

/**
 * Tries each `(placement × orientation)` candidate in order, returning the first whose rotated box holds
 * the whole text, fits `d.region ?? bounds` and clears every obstacle in the index. A candidate that
 * only fits by truncating is remembered and the cascade continues, so the least-truncated candidate wins
 * over an earlier heavily-truncated one. When no candidate fits at all: a {@link
 * PointLabelDatum.neverDrop} label, or one with `alwaysShow` set, keeps the best candidate by tier —
 * least truncated, then least buried by an obstacle, then least region-overflowing — and any other
 * label is dropped (`undefined`). A `neverDrop` label is always rendered
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
    threshold: number,
    resolveCandidateStyle: CandidateStyleResolver | undefined
): PlacedLabel | undefined {
    bestChoice.tier = Infinity;
    bestChoice.score = Infinity;
    if (d.positionedCandidates != null) {
        return placeFromPositionedCandidates(d, collideWith, threshold, index, bounds);
    }
    const { fit } = d;
    // Measured once here rather than per candidate: every candidate refits the same source text. A styled
    // label instead re-measures whenever its resolved font changes (see `styledFitSource`).
    const styled = resolveCandidateStyle != null;
    cascadeFitSource = fit == null || styled ? undefined : measureLabelText(fit.text, fit.font);
    styledSourceFont = '';
    cascadeDatum = d;
    cascadeIndex = index;
    cascadePlacements = placements;
    cascadeOrientations = orientationsOf(d);
    cascadeSingleOrientation = singleOrientationOf(d);
    cascadeStyle = resolveCandidateStyle;
    cascadeGap = gap;
    cascadeSpacing = spacing;
    cascadeInflate = Math.max(threshold, 0);
    cascadeThreshold = threshold;
    candidateCollideWith = collideWith;
    candidateThreshold = threshold;
    markerCentreOf(d);
    candidateOwnMarkerCx = markerCentre.cx;
    candidateOwnMarkerCy = markerCentre.cy;
    candidateOwnMarkerR = markerSizeOf(d) / 2;
    // Bar labels carry their own bar rect here so an inside label excludes its own shape; marker series
    // leave it unset (their own marker is handled by the own-marker circle gate above).
    candidateOwnBox = d.ownBox;
    candidateOwnBoxLabelsCollide = d.ownBoxLabelsCollide ?? false;
    cascadeRawRegion = d.region ?? bounds;
    cascadeContainThreshold = containmentThreshold(threshold);
    cascadeRegion = deflateRegion(deflatedRegionBox, cascadeRawRegion, cascadeContainThreshold);
    cascadeFitRegion = d.region == null ? undefined : deflateRegion(fitRegionBox, d.region, threshold);
    // inside-start/inside-end centre on the bar's end, so a candidate rotated along the bar would
    // straddle it; slide it flush inside its own bar rect instead.
    cascadeFlushToRegion = d.region != null && d.neverDrop === true;
    cascadeKeepBest = d.neverDrop === true || alwaysShow;

    const placed = cascadeCandidates();
    if (placed != null) return placed;

    const shrunk = shrinkToClear();
    if (shrunk != null) return shrunk;

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
    // No compass placement and no own marker on this path (bars): the own-marker gate in
    // obstacleOverlapsCandidate must stay inert, so no obstacle centre can match.
    candidatePlacement = undefined;
    candidateOwnMarkerCx = Number.NaN;
    candidateOwnMarkerCy = Number.NaN;
    candidateOwnMarkerR = -1;
    candidateOwnBox = d.ownBox;
    candidateOwnBoxLabelsCollide = d.ownBoxLabelsCollide ?? false;

    const { fit } = d;
    // Measured once here rather than per candidate: every candidate refits the same source text. A
    // candidate carrying its own styled font re-measures under it instead (see `styledFitSource`).
    const fitSource = fit == null ? undefined : measureLabelText(fit.text, fit.font);
    styledSourceFont = '';
    const containThreshold = containmentThreshold(threshold);
    for (let ci = 0, ln = candidates.length; ci < ln; ci++) {
        const c = candidates[ci];
        // A candidate the styler disabled is skipped, so a label disabled at every candidate is dropped.
        if (c.hidden === true) continue;
        const rawRegion = c.region ?? bounds;
        const region = deflateRegion(deflatedRegionBox, rawRegion, containThreshold);
        let { text } = d.label;
        let { width, height } = c.size ?? d.label;
        let dropped = 0;
        let shrink = 0;
        candidateFontSize = undefined;
        candidateBox.x = c.box.x;
        candidateBox.y = c.box.y;
        candidateBox.width = c.box.width;
        candidateBox.height = c.box.height;
        if (fit != null && c.fitTo != null) {
            const styledFont = c.fitTo.font;
            const source = styledFont == null ? fitSource : styledFitSource(fit, styledFont);
            const container = deflateContainer(c.fitTo.container, threshold);
            if (
                !fitLabelToCandidate(fit, styledFont ?? fit.font, source, container, c.fitTo.shape, c.fitTo.shapeAlign)
            ) {
                continue;
            }
            ({ text, dropped, shrink } = fittedLabel);
            writeCandidateLabel(c.fitTo.padding, styledFont ?? fit.font);
            ({ width, height } = candidateLabel);
            resizeCandidateBox(c, width, height);
        }
        let { x, y } = candidateBox;
        const { width: cw, height: ch } = candidateBox;
        let offsetX = 0;
        let offsetY = 0;
        // Region-bound candidates are slid flush inside their region; a collision-only region is not
        // flushed, so an overflowing box is left to fail containment below.
        if (c.region != null && c.flushToRegion !== false) {
            const nx = clampAxis(x, cw, rawRegion.x, rawRegion.width);
            const ny = clampAxis(y, ch, rawRegion.y, rawRegion.height);
            offsetX = nx - x;
            offsetY = ny - y;
            candidateBox.x = x = nx;
            candidateBox.y = y = ny;
        }
        inflateBoxInto(queryBox, candidateBox, inflate);
        const rotation = c.rotation ?? 0;
        const contained = boxContains(region, x, y, cw, ch);
        if (contained && !obstacleIndex.query(queryBox, obstacleOverlapsCandidate)) {
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
                    fontSize: candidateFontSize,
                };
            }
            recordBestChoice(TIER_FIT, dropped + shrink, text, width, height, rotation, offsetX, offsetY, undefined, c);
            continue;
        }
        if (d.neverDrop === true) {
            const overflow = regionOverflow(region, x, y, cw, ch);
            recordBestChoice(TIER_OVERFLOWING, overflow, text, width, height, rotation, offsetX, offsetY, undefined, c);
        }
        // Obstacle-only failure: the candidate has the room, an obstacle is taking part of it. Shrinking is
        // tried last so a failed attempt can clobber the shared candidate scratch freely.
        if (contained && shrinkPositionedCandidate(d, c, fitSource, rawRegion, region, inflate)) {
            recordBestChoice(
                TIER_FIT,
                candidateLabel.dropped + candidateLabel.shrink,
                candidateLabel.text,
                candidateLabel.width,
                candidateLabel.height,
                rotation,
                shrunkOffset.x,
                shrunkOffset.y,
                undefined,
                c
            );
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
 * Returns `undefined` for directional candidates or when the datum carries no
 * {@link PointLabelDatum.insideSize}, so the caller falls back to the shared region.
 */
function insideRegionFor(
    d: PointLabelDatum,
    placement: LabelPlacement | undefined,
    x: number,
    y: number,
    boxWidth: number,
    boxHeight: number
): BoxBounds | undefined {
    if (placement !== 'inside' || d.insideSize == null) return undefined;
    const markerSize = markerSizeOf(d);
    const rw = d.insideSize.width * markerSize;
    const rh = d.insideSize.height * markerSize;
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
