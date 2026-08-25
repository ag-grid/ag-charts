import type { AgChartLabelOrientation, PaddingOptions } from 'ag-charts-types';

import type { NormalisedTextOrSegments } from '../../types/normalised-options/normalisedCommonOptions';
import type { Point } from '../../types/scene';
import type { FontOptions } from '../../types/text';
import { toArray } from '../data/arrays';
import { type LabelFit } from '../text/textWrapper';
import { toDegrees, toRadians } from './angle';
import type { BoxBounds } from './boxBounds';
import {
    type CollideWith,
    type LabelFitDescriptor,
    type LabelFitOptions,
    type LabelObstacle,
    type OrientationAnchor,
    type PlacedLabel,
    type PointLabelDatum,
    type PositionedLabelCandidate,
    labelGlyphCentre,
    measureLabelText,
    orientationAngles,
    resolveLabelFit,
} from './labelPlacement';
import { getMinOuterRectSize } from './math/shapeUtils';

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
 * Flags each routed bar label hidden when the engine dropped it: a routed label (`candidates` set) the
 * engine kept is in `placed`, one it dropped is absent. Baked labels (no candidates) are left visible.
 * `resolveTarget` maps each element to its label object, which doubles as its {@link BarLabelTarget}.
 */
export function applyPlacedBarLabelVisibility<T>(
    elements: Iterable<T> | undefined,
    placed: readonly PlacedLabel<unknown>[],
    resolveTarget: (element: T) => (BarLabelTarget & { candidates?: unknown; hidden?: boolean }) | undefined
): void {
    // The targets the engine kept: a hideable label it dropped is absent from `placed`.
    const kept = new Set<BarLabelTarget>();
    for (const { datum } of placed) {
        kept.add((datum as BarPlacedLabelDatum).target);
    }
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
 * Whether a bar-family label takes the positioned-candidate route rather than its unconditional
 * fast-path bake: a multi-entry placement array cascades through obstacles, a hideable label
 * (`alwaysShow: false`) routes even a single placement so a no-fit label can be dropped, and a label
 * that opted into overflow control routes so an obstacle can be answered by shrinking into the room it
 * leaves rather than by overlapping it — unless an orientation array already routes it, which resolves
 * the same fit against the bar region on the cheaper baked path.
 */
export function barLabelUsesPositionedCandidates(
    orientation: AgChartLabelOrientation | AgChartLabelOrientation[] | undefined,
    placement: unknown,
    alwaysShow: boolean,
    fit: LabelFit | undefined
): boolean {
    return (
        barLabelResolvesPlacement(placement) ||
        !alwaysShow ||
        (fit != null && !barLabelResolvesOrientation(orientation))
    );
}

/**
 * Whether a bar-family label must route through the placement engine rather than take its unconditional
 * fast-path bake: an orientation array resolves against the bar region, and a placement array, a hideable
 * label or a fit policy cascades through {@link barLabelUsesPositionedCandidates}.
 */
export function barLabelRoutesThroughEngine(
    orientation: AgChartLabelOrientation | AgChartLabelOrientation[] | undefined,
    placement: unknown,
    alwaysShow: boolean,
    fit: LabelFit | undefined
): boolean {
    return (
        barLabelResolvesOrientation(orientation) || barLabelResolvesPlacement(placement) || !alwaysShow || fit != null
    );
}

/** The label-surface fields a routing decision reads, so a caller hands over its label, not four arguments. */
export interface BarLabelRoutingOptions extends LabelFitOptions {
    readonly orientation?: AgChartLabelOrientation | AgChartLabelOrientation[];
    readonly placement?: unknown;
    readonly collision: { readonly alwaysShow: boolean };
}

/** {@link barLabelRoutesThroughEngine} for a whole label surface, resolving its own fit policy. */
export function barLabelPropsRouteThroughEngine(label: BarLabelRoutingOptions): boolean {
    const alwaysShow = label.collision.alwaysShow;
    return barLabelRoutesThroughEngine(
        label.orientation,
        label.placement,
        alwaysShow,
        resolveLabelFit(label, !alwaysShow)
    );
}

/** {@link barLabelUsesPositionedCandidates} for a whole label surface, resolving its own fit policy. */
export function barLabelPropsUsePositionedCandidates(label: BarLabelRoutingOptions): boolean {
    const alwaysShow = label.collision.alwaysShow;
    return barLabelUsesPositionedCandidates(
        label.orientation,
        label.placement,
        alwaysShow,
        resolveLabelFit(label, !alwaysShow)
    );
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
