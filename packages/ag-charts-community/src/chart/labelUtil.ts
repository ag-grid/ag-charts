import type {
    BarValueAnchor,
    BoxBounds,
    Callback,
    CallbackParam,
    DynamicContext,
    FontOptions,
    IsAny,
    LabelFit,
    LabelPlacement,
    NormalisedColorType,
    NormalisedTextOrSegments,
    OrientationAnchor,
    Point,
    PositionedLabelCandidate,
} from 'ag-charts-core';
import {
    type NormalisedChartLabelStyleOptions,
    fitLabelText,
    getMinOuterRectSize,
    insideBarContainer,
    insideBarRegion,
    insideBarValueInsets,
    labelGlyphCentre,
    mergeDefaults,
    orientationAngles,
    rotatedGlyphDrift,
    rotatedLabelInset,
} from 'ag-charts-core';
import type {
    AgChartLabelOrientation,
    AgChartLabelStylerParams,
    AgMarkerShape,
    CssColor,
    HighlightState,
    NormalisedCallbackParams,
    PaddingOptions,
    PixelSize,
    SelectionState,
} from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { ChartRegistry } from '../module/moduleContext';
import type { Text } from '../scene/shape/text';
import { isRotatable } from '../scene/transformable';
import { type Label, type LabelPlacementStyle, resolvePlacementLabelStyle } from './label';
import { markerLabelRect } from './marker/markerLabelRect';
import { getItemId } from './series/pickManager';
import type { DatumIndex, SeriesNodeDatum } from './series/seriesTypes';

interface SeriesLike {
    id: string;
    ctx: DynamicContext<ChartRegistry>;
    declarationOrder: number;
    readonly data?: { readonly dataIdKey?: string };
    get visible(): boolean;
    cachedCallWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> | undefined;
    isSeriesHighlighted(highlightedDatum: HighlightNodeDatum | undefined): boolean;
    getHighlightStateString(
        datum: HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: DatumIndex
    ): HighlightState;
    getSelectionStateString(datumIndex: DatumIndex | undefined): SelectionState | undefined;
    getCandidateStateString(datumIndex: DatumIndex | undefined): SelectionState | undefined;
}

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

/** Bar `beside-*` placements offset a label perpendicular to the value axis, to the side of its segment. */
export type BesideBarLabelPlacement = `beside-${'before' | 'after'}-${'start' | 'center' | 'end'}`;

export type BarLabelPlacement =
    | 'inside-center'
    | 'inside-start'
    | 'inside-end'
    | 'outside-start'
    | 'outside-end'
    | BesideBarLabelPlacement;

/** A label's resolved inside/outside placement, selecting which placement-style overrides apply. */
export type ResolvedLabelPlacement = 'inside' | 'outside';

/** The final placement/orientation a series chose for a label, surfaced to `itemStyler` params. */
type ResolvedPlacement = Pick<AgChartLabelStylerParams<unknown, unknown>, 'placement' | 'orientation'>;

type LabelDatum = Point & {
    text: NormalisedTextOrSegments;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    /**
     * The label's resolved placement. Bar-family labels carry the granular {@link BarLabelPlacement}
     * (coarsened to inside/outside via {@link toResolvedPlacement} when selecting placement styles);
     * other series carry the coarse {@link ResolvedLabelPlacement}. Unset applies neither style.
     */
    placement?: ResolvedLabelPlacement | BarLabelPlacement;
    /** Rotation in radians applied to the label node; `undefined`/`0` renders upright. */
    rotation?: number;
    /** Translation (px) sliding a region-bound label flush inside its region; `undefined`/`0` leaves it anchored. */
    offsetX?: number;
    offsetY?: number;
};

/**
 * Fits a label's text to its resolved policy and, when the series supplies one, its geometric container
 * (bar rect, donut hole, …). Each axis is bounded by the tighter of the explicit `maxWidth`/`maxHeight`
 * and the container extent, so text never overflows its container yet the user can constrain further.
 * When the policy resolves to "show" (no truncation and no collision avoidance) no bound is applied and
 * the text renders in full, leaving container series unchanged unless the user opts into truncation.
 */
export function fitLabelToContainer(
    text: NormalisedTextOrSegments,
    fit: LabelFit | undefined,
    font: FontOptions,
    container: { width: number; height: number } | undefined
): NormalisedTextOrSegments {
    return fitLabelText(text, boundLabelFit(fit, container), font);
}

/**
 * Bounds a fit's `maxWidth`/`maxHeight` by a container extent, taking the tighter of the explicit bound
 * and the container. Returns `fit` unchanged when there is no fit or no container. Series with an
 * invariant container should call this once at context-build time rather than per datum.
 */
export function boundLabelFit(
    fit: LabelFit | undefined,
    container: { width: number; height: number } | undefined
): LabelFit | undefined {
    if (fit == null || container == null) {
        return fit;
    }
    return {
        ...fit,
        maxWidth: Math.min(fit.maxWidth ?? Infinity, container.width),
        maxHeight: Math.min(fit.maxHeight ?? Infinity, container.height),
    };
}

/**
 * Container that keeps an `inside` label within a marker of diameter `markerSize`, sized to the largest
 * rectangle that fits the marker's shape (analysed once per shape by {@link markerLabelRect}). `threshold`
 * shrinks that rectangle on every side so the label clears the marker walls by that many pixels. Pair
 * with {@link resolveInsidePlacement}'s `offset` to position the label at that rectangle, which need not
 * be marker-centred.
 */
export function insideMarkerContainer(
    markerSize: number,
    shape?: AgMarkerShape,
    threshold = 0
): { width: number; height: number } {
    const rect = markerLabelRect(shape);
    return {
        width: Math.max(0, markerSize * rect.width - 2 * threshold),
        height: Math.max(0, markerSize * rect.height - 2 * threshold),
    };
}

/** Inside-marker label geometry resolved from a series' configured placements and marker shape. */
export interface InsidePlacement {
    /** True when every placement is `inside`, so the text is fitted to the marker up front. */
    readonly insideOnly: boolean;
    /** Centres an `inside` label on the marker's inscribed rectangle; set whenever `inside` is a placement. */
    readonly offset: Point | undefined;
    /** Inscribed-rect size so the engine rejects an oversized `inside` candidate; set only for a mixed list. */
    readonly size: { width: number; height: number } | undefined;
}

/**
 * Resolves the inside-marker geometry for a placement list. A mixed list (e.g. `['inside','top']`) keeps
 * full-size text and instead supplies `size`, so an `inside` candidate too large for the marker fails and
 * cascades to the next placement; an inside-only list leaves `size` unset and fits the text to the marker.
 */
export function resolveInsidePlacement(
    placements: readonly LabelPlacement[],
    shape: AgMarkerShape | undefined
): InsidePlacement {
    const insideOnly = placements.length > 0 && placements.every((placement) => placement === 'inside');
    const rect = placements.includes('inside') ? markerLabelRect(shape) : undefined;
    return {
        insideOnly,
        offset: rect ? { x: rect.cx, y: rect.cy } : undefined,
        size: !insideOnly && rect ? { width: rect.width, height: rect.height } : undefined,
    };
}

/** Selects the style overrides for a label's resolved placement; `undefined` when neither applies. */
export function pickPlacementStyle(
    styles: { insideStyle: LabelPlacementStyle; outsideStyle: LabelPlacementStyle } | undefined,
    placement: ResolvedLabelPlacement | undefined
): LabelPlacementStyle | undefined {
    if (styles == null || placement == null) return undefined;
    return placement === 'inside' ? styles.insideStyle : styles.outsideStyle;
}

/** Coarsens a granular bar placement to the inside/outside distinction the placement styles select on. */
export function toResolvedPlacement(placement: BarLabelPlacement): ResolvedLabelPlacement {
    return placement.startsWith('inside') ? 'inside' : 'outside';
}

export function getLabelStyles<TParams>(
    series: SeriesLike,
    nodeDatum: SeriesNodeDatum | undefined,
    params: TParams,
    label: Label<TParams>,
    isHighlight: boolean,
    activeHighlight: HighlightNodeDatum | undefined,
    labelPath: string[] = ['series', `${series.declarationOrder}`, 'label'],
    placementStyle?: LabelPlacementStyle,
    resolvedPlacement?: ResolvedPlacement
): NormalisedChartLabelStyleOptions & { fontSize: number } {
    const resolvedLabel = resolvePlacementLabelStyle(label, placementStyle);
    if (series.visible && label.itemStyler) {
        const highlightState = series.getHighlightStateString(
            activeHighlight,
            isHighlight ||
                (nodeDatum != null &&
                    activeHighlight?.series === nodeDatum.series &&
                    activeHighlight?.datumIndex === nodeDatum.datumIndex),
            nodeDatum?.datumIndex
        );

        const itemId: string | number | undefined = nodeDatum
            ? getItemId(nodeDatum, series.data?.dataIdKey)
            : undefined;

        const styleParams: NormalisedCallbackParams<
            AgChartLabelStylerParams<unknown, unknown>,
            { color?: CssColor; fontSize: number; fill?: NormalisedColorType }
        > = {
            border: resolvedLabel.border,
            color: resolvedLabel.color,
            cornerRadius: resolvedLabel.cornerRadius,
            datum: nodeDatum?.datum,
            enabled: label.enabled,
            fill: resolvedLabel.fill,
            fillOpacity: resolvedLabel.fillOpacity,
            fontFamily: resolvedLabel.fontFamily,
            fontSize: resolvedLabel.fontSize,
            fontStyle: resolvedLabel.fontStyle,
            fontWeight: resolvedLabel.fontWeight,
            itemId,
            itemType: nodeDatum?.itemType,
            seriesId: series.id,
            padding: resolvedLabel.padding,
            // Present only for series that resolve them, so an unrelated series' styler params are unchanged.
            ...(resolvedPlacement?.placement !== undefined && { placement: resolvedPlacement.placement }),
            ...(resolvedPlacement?.orientation !== undefined && { orientation: resolvedPlacement.orientation }),
            highlightState,
            selectionState: series.getSelectionStateString(nodeDatum?.datumIndex),
            candidateState: series.getCandidateStateString(nodeDatum?.datumIndex),
        };
        const stylerResult =
            series.ctx.optionsGraphService.resolvePartial(
                labelPath,
                series.cachedCallWithContext(label.itemStyler, { ...params, ...styleParams }),
                { pick: false }
            ) ?? {};

        return mergeDefaults(stylerResult, styleParams);
    }

    return resolvedLabel;
}

// Enforce that D must not be `any`
export function updateLabelNode<TParams, D extends LabelDatum>(
    series: IsAny<D> extends false ? SeriesLike : never,
    textNode: IsAny<D> extends false ? Text : never,
    params: IsAny<D> extends false ? TParams : never,
    label: IsAny<D> extends false ? Label<TParams, unknown> : never,
    labelDatum: D | undefined,
    highlight: { isHighlight: boolean; activeHighlight: HighlightNodeDatum | undefined },
    labelPath?: string[],
    placementStyle?: LabelPlacementStyle,
    resolvedPlacement?: ResolvedPlacement
): void;

export function updateLabelNode<TParams>(
    series: SeriesLike,
    textNode: Text<SeriesNodeDatum>,
    params: TParams,
    label: Label<TParams, unknown>,
    labelDatum: LabelDatum | undefined,
    highlight: { isHighlight: boolean; activeHighlight: HighlightNodeDatum | undefined },
    labelPath?: string[],
    placementStyle?: LabelPlacementStyle,
    resolvedPlacement?: ResolvedPlacement
) {
    const { isHighlight, activeHighlight } = highlight;
    if (series.visible && label.enabled && labelDatum) {
        const style = getLabelStyles(
            series,
            textNode.datum,
            params,
            label,
            isHighlight,
            activeHighlight,
            labelPath,
            placementStyle,
            resolvedPlacement
        );
        textNode.visible = true;
        // Offset slides a rotated bar label flush inside its bar rect; the pivot below is re-derived
        // from the shifted position, so the rotated glyph box moves with it. `0` for every other label.
        textNode.x = labelDatum.x + (labelDatum.offsetX ?? 0);
        textNode.y = labelDatum.y + (labelDatum.offsetY ?? 0);
        textNode.text = labelDatum.text;
        textNode.fill = style.color;
        textNode.setAlign(labelDatum);
        textNode.setFont(style);
        textNode.setBoxing(style);
        if (isRotatable(textNode)) {
            const rotation = labelDatum.rotation ?? 0;
            if (rotation !== 0) {
                // Pivot about the untransformed glyph-box centre so the label rotates in place.
                const bbox = textNode.getTextMeasureBBox();
                textNode.rotationCenterX = bbox.x + bbox.width / 2;
                textNode.rotationCenterY = bbox.y + bbox.height / 2;
            }
            textNode.rotation = rotation;
        }
    } else {
        textNode.visible = false;
    }
}

interface PlacementConfig {
    inside: boolean;
    direction: -1 | 1;
    textAlignment: -1 | 1;
}

const placements: Record<Exclude<BarLabelPlacement, 'inside-center' | BesideBarLabelPlacement>, PlacementConfig> = {
    'inside-start': { inside: true, direction: -1, textAlignment: 1 },
    'inside-end': { inside: true, direction: 1, textAlignment: -1 },
    'outside-start': { inside: false, direction: -1, textAlignment: -1 },
    'outside-end': { inside: false, direction: 1, textAlignment: 1 },
};

function isBesidePlacement(placement: BarLabelPlacement): placement is BesideBarLabelPlacement {
    return placement.startsWith('beside-');
}

/** The value-axis end an inside/beside placement anchors against, so `spacing` reserves its gap there. */
export function barValueAnchor(placement: BarLabelPlacement): BarValueAnchor {
    const value = isBesidePlacement(placement) ? besideValuePlacement(placement).valuePlacement : placement;
    if (value.endsWith('-center')) return 'center';
    return value.endsWith('-start') ? 'start' : 'end';
}

/**
 * Containment region and text container for an inside bar label at `placement`: the region reserves the
 * anchored-side `spacing` gap (nothing for the centred placement) plus `threshold` cross-axis
 * wall-clearance, so the gap survives the engine's flush/containment; the container is that region minus
 * the drawn box, bounding how much text fits. Fit and containment share the region so fitted text can
 * never overflow the bound the engine contains it against.
 */
export function insideBarLabelBounds(
    rect: Bounds,
    placement: BarLabelPlacement,
    isUpward: boolean,
    isVertical: boolean,
    spacing: number,
    threshold: number,
    box: Required<PaddingOptions>
): { region: BoxBounds; container: { width: number; height: number } } {
    const insets = insideBarValueInsets(barValueAnchor(placement), isUpward, isVertical, spacing);
    const region = insideBarRegion(rect, insets.min, insets.max, threshold, isVertical);
    return { region, container: insideBarContainer(region, box) };
}

/**
 * Resolves a `beside-*` placement into the side it sits on (`after` = the far side of the cross axis
 * before any reversal) and the along-value-axis anchor it reuses from the matching `inside-*` placement.
 */
function besideValuePlacement(placement: BesideBarLabelPlacement): {
    after: boolean;
    valuePlacement: Exclude<BarLabelPlacement, BesideBarLabelPlacement>;
} {
    const after = placement.includes('-after-');
    let align: 'start' | 'center' | 'end' = 'center';
    if (placement.endsWith('-start')) {
        align = 'start';
    } else if (placement.endsWith('-end')) {
        align = 'end';
    }
    return { after, valuePlacement: `inside-${align}` };
}

export function adjustLabelPlacement({
    isUpward,
    isVertical,
    placement,
    spacing = 0,
    boxPadding,
    rect,
    rotation = 0,
    labelWidth = 0,
    labelHeight = 0,
    crossReversed = false,
}: {
    placement: BarLabelPlacement;
    isUpward: boolean;
    isVertical: boolean;
    spacing?: PixelSize;
    boxPadding?: Required<PaddingOptions>;
    rect: Bounds;
    rotation?: number;
    labelWidth?: number;
    labelHeight?: number;
    crossReversed?: boolean;
}): Omit<LabelDatum, 'text'> {
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    let textAlign: CanvasTextAlign = 'center';
    let textBaseline: CanvasTextBaseline = 'middle';

    // The node rotates the padded box about its own centre; asymmetric padding drifts the glyph off the
    // anchor. Pre-subtracting the drift keeps the glyph centred on the bar's cross-axis. Zero unrotated.
    const drift = boxPadding == null ? { x: 0, y: 0 } : rotatedGlyphDrift(rotation, boxPadding);

    // Distance from the anchor to the (rotated) box edge facing the bar; equals boxPadding[facing] for an
    // unrotated label, but grows with the box's cross-axis when the label is rotated. Added beyond
    // `spacing` so the box edge — not the text — sits `spacing` from the bar, on whichever axis faces it.
    const insetFor = (facing: keyof Required<PaddingOptions>) =>
        boxPadding == null ? 0 : rotatedLabelInset(facing, rotation, labelWidth, labelHeight, boxPadding);

    // `beside-*` reuses the matching `inside-*` anchor for the value axis, then floats the label off the
    // segment on the cross axis (overriding that axis's coordinate and text anchor below).
    let beside: { after: boolean } | undefined;
    let valuePlacement: Exclude<BarLabelPlacement, BesideBarLabelPlacement>;
    if (isBesidePlacement(placement)) {
        const resolved = besideValuePlacement(placement);
        beside = { after: resolved.after };
        valuePlacement = resolved.valuePlacement;
    } else {
        valuePlacement = placement;
    }

    // A beside label is pushed off the bar by `spacing` on its cross axis only (below); along the value
    // axis it just aligns start/center/end to the bar, with no `spacing` gap.
    const valueSpacing = beside == null ? spacing : 0;

    if (valuePlacement === 'inside-center') {
        // No bar-facing axis: keep the glyph centred on both axes of the bar rect.
        x -= drift.x;
        y -= drift.y;
    } else {
        const barDirection = (isUpward ? 1 : -1) * (isVertical ? -1 : 1);
        const { direction, textAlignment } = placements[valuePlacement];
        const displacementRatio = (direction + 1) * 0.5;

        if (isVertical) {
            const y0 = isUpward ? rect.y + rect.height : rect.y;
            const height = rect.height * barDirection;
            const facing = textAlignment === barDirection ? 'top' : 'bottom';
            const inset = insetFor(facing);
            y = y0 + height * displacementRatio + (valueSpacing + inset) * textAlignment * barDirection;
            x -= drift.x;
            textBaseline = facing;
        } else {
            const x0 = isUpward ? rect.x : rect.x + rect.width;
            const width = rect.width * barDirection;
            const facing = textAlignment === barDirection ? 'left' : 'right';
            const inset = insetFor(facing);
            x = x0 + width * displacementRatio + (valueSpacing + inset) * textAlignment * barDirection;
            y -= drift.y;
            textAlign = facing;
        }
    }

    if (beside) {
        // Flip the side with a reversed category axis so `before`/`after` keep their physical meaning
        // (column: before → left, after → right; horizontal bar: before → above, after → below). The
        // facing box inset keeps the box edge — not the text — `spacing` from the bar.
        const after = beside.after !== crossReversed;
        if (isVertical) {
            const facing = after ? 'left' : 'right';
            const offset = spacing + insetFor(facing);
            x = after ? rect.x + rect.width + offset : rect.x - offset;
            textAlign = facing;
        } else {
            const facing = after ? 'top' : 'bottom';
            const offset = spacing + insetFor(facing);
            y = after ? rect.y + rect.height + offset : rect.y - offset;
            textBaseline = facing;
        }
    }

    return { x, y, textAlign, textBaseline };
}

/**
 * A pre-positioned bar label candidate: the generic {@link PositionedLabelCandidate} box the placement
 * engine cascades over, plus the bar-specific `anchor` and granular `placement` written back onto the
 * label node when this candidate wins (its coarse inside/outside is derived from `placement`).
 */
export interface BarPositionedCandidate extends PositionedLabelCandidate {
    readonly anchor: OrientationAnchor;
    readonly placement: BarLabelPlacement;
}

/**
 * Builds the ordered candidate list a bar label cascades through, one entry per
 * `placement` (outer) × `orientation` (inner) — the ordering that yields inside-horizontal →
 * inside-vertical → outside-horizontal → outside-vertical for the ticket's example. The glyph centre is
 * orientation-invariant, so it is measured once per placement and shared across that placement's
 * orientations. Inside placements constrain to the inset bar rect; outside placements float (no region).
 */
export function buildBarLabelCandidates({
    isUpward,
    isVertical,
    placements: placementList,
    orientations,
    spacing,
    threshold,
    boxPadding,
    rect,
    width,
    height,
    crossReversed = false,
    rejectOutsideStart = false,
    rejectOutsideEnd = false,
    plotRegion,
}: {
    isUpward: boolean;
    isVertical: boolean;
    placements: readonly BarLabelPlacement[];
    orientations: readonly AgChartLabelOrientation[];
    spacing: number;
    threshold: number;
    boxPadding?: Required<PaddingOptions>;
    rect: Bounds;
    width: number;
    height: number;
    crossReversed?: boolean;
    rejectOutsideStart?: boolean;
    rejectOutsideEnd?: boolean;
    plotRegion?: Bounds;
}): BarPositionedCandidate[] {
    // Drop the outside placements that would point into an adjacent stacked segment on that side, so the
    // cascade falls through to a beside/inside candidate rather than mislabelling the neighbour. Keep the
    // original list if every placement is dropped, so a label is still produced.
    const rejectsOutside = rejectOutsideStart || rejectOutsideEnd;
    let effectivePlacements = placementList;
    if (rejectsOutside) {
        effectivePlacements = placementList.filter(
            (placement) =>
                !(placement === 'outside-start' && rejectOutsideStart) &&
                !(placement === 'outside-end' && rejectOutsideEnd)
        );
        if (effectivePlacements.length === 0) {
            effectivePlacements = placementList;
        }
    }

    // `plotRegion` is a collision-only boundary for outside/beside candidates (flushToRegion: false): a
    // label overflowing it (e.g. into the axis-label zone) fails containment so the cascade falls through
    // to the next placement, rather than being clamped into it or floating into the engine's wider bounds.
    const candidates: BarPositionedCandidate[] = [];
    for (const placement of effectivePlacements) {
        const anchor = adjustLabelPlacement({
            isUpward,
            isVertical,
            placement,
            spacing,
            boxPadding,
            rect,
            crossReversed,
        });
        const isInside = placement.startsWith('inside');
        // Inside labels reserve `spacing` on the end they anchor against, so the gap survives the engine's
        // flush/containment (not just the anchor); centred labels reserve nothing.
        const insets = insideBarValueInsets(barValueAnchor(placement), isUpward, isVertical, spacing);
        const region = isInside ? insideBarRegion(rect, insets.min, insets.max, threshold, isVertical) : plotRegion;
        const centre = labelGlyphCentre(anchor, width, height);
        // The anchor sits on the glyph's edge, but the drawn box protrudes `boxPadding[facing]` past it
        // toward the bar (the offset `adjustLabelPlacement` added so the box clears the bar by `spacing`).
        // Recentre the collision footprint on that drawn box, else it reaches the box extent further onto
        // a neighbour than what is rendered and the label collides before its box actually touches.
        if (boxPadding != null) {
            if (anchor.textAlign === 'right' || anchor.textAlign === 'end') {
                centre.x += boxPadding.right;
            } else if (anchor.textAlign === 'left' || anchor.textAlign === 'start') {
                centre.x -= boxPadding.left;
            }
            if (anchor.textBaseline === 'bottom') {
                centre.y += boxPadding.bottom;
            } else if (anchor.textBaseline === 'top') {
                centre.y -= boxPadding.top;
            }
        }
        for (const orientation of orientations) {
            const rotationDeg = orientationAngles[orientation];
            const { width: fw, height: fh } = getMinOuterRectSize(rotationDeg, width, height);
            const box = { x: centre.x - fw / 2, y: centre.y - fh / 2, width: fw, height: fh };
            candidates.push({
                box,
                region,
                flushToRegion: isInside ? undefined : false,
                rotation: rotationDeg || undefined,
                anchor,
                placement,
            });
        }
    }
    return candidates;
}
