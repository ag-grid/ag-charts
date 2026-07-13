import type {
    Callback,
    CallbackParam,
    DynamicContext,
    FontOptions,
    IsAny,
    LabelFit,
    NormalisedColorType,
    NormalisedTextOrSegments,
    Point,
} from 'ag-charts-core';
import { type NormalisedChartLabelStyleOptions, fitLabelText, mergeDefaults } from 'ag-charts-core';
import type {
    AgChartLabelStylerParams,
    AgMarkerShape,
    CssColor,
    HighlightState,
    NormalisedCallbackParams,
    PixelSize,
    SelectionState,
} from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { ChartRegistry } from '../module/moduleContext';
import type { Text } from '../scene/shape/text';
import { isRotatable } from '../scene/transformable';
import type { Label, LabelPlacementStyle } from './label';
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

export type BarLabelPlacement = 'inside-center' | 'inside-start' | 'inside-end' | 'outside-start' | 'outside-end';

/** A label's resolved inside/outside placement, selecting which placement-style overrides apply. */
export type ResolvedLabelPlacement = 'inside' | 'outside';

type LabelDatum = Point & {
    text: NormalisedTextOrSegments;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    /** Resolved inside/outside placement, used to pick `insideStyle`/`outsideStyle`; unset applies neither. */
    placement?: ResolvedLabelPlacement;
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
 * rectangle that fits the marker's shape (analysed once per shape by {@link markerLabelRect}). Pair with
 * {@link insideMarkerOffset} to position the label at that rectangle, which need not be marker-centred.
 */
export function insideMarkerContainer(markerSize: number, shape?: AgMarkerShape): { width: number; height: number } {
    const rect = markerLabelRect(shape);
    return { width: markerSize * rect.width, height: markerSize * rect.height };
}

/** The inside-label rectangle's centre offset from the marker centre, as a fraction of the diameter. */
export function insideMarkerOffset(shape: AgMarkerShape | undefined): Point {
    const { cx, cy } = markerLabelRect(shape);
    return { x: cx, y: cy };
}

/** Selects the style overrides for a label's resolved placement; `undefined` when neither applies. */
export function pickPlacementStyle(
    styles: { insideStyle: LabelPlacementStyle; outsideStyle: LabelPlacementStyle } | undefined,
    placement: ResolvedLabelPlacement | undefined
): LabelPlacementStyle | undefined {
    if (styles == null || placement == null) return undefined;
    return placement === 'inside' ? styles.insideStyle : styles.outsideStyle;
}

export function getLabelStyles<TParams>(
    series: SeriesLike,
    nodeDatum: SeriesNodeDatum | undefined,
    params: TParams,
    label: Label<TParams>,
    isHighlight: boolean,
    activeHighlight: HighlightNodeDatum | undefined,
    labelPath: string[] = ['series', `${series.declarationOrder}`, 'label'],
    placementStyle?: LabelPlacementStyle
): NormalisedChartLabelStyleOptions & { fontSize: number } {
    // Overlay placement overrides beneath the top-level label so an explicit `label.<prop>` wins and
    // any unset property falls back to the resolved placement's `insideStyle`/`outsideStyle` value.
    const resolvedLabel = placementStyle == null ? label : mergeDefaults(label, placementStyle);
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
    placementStyle?: LabelPlacementStyle
): void;

export function updateLabelNode<TParams>(
    series: SeriesLike,
    textNode: Text<SeriesNodeDatum>,
    params: TParams,
    label: Label<TParams, unknown>,
    labelDatum: LabelDatum | undefined,
    highlight: { isHighlight: boolean; activeHighlight: HighlightNodeDatum | undefined },
    labelPath?: string[],
    placementStyle?: LabelPlacementStyle
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
            placementStyle
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

const placements: Record<Exclude<BarLabelPlacement, 'inside-center'>, PlacementConfig> = {
    'inside-start': { inside: true, direction: -1, textAlignment: 1 },
    'inside-end': { inside: true, direction: 1, textAlignment: -1 },
    'outside-start': { inside: false, direction: -1, textAlignment: -1 },
    'outside-end': { inside: false, direction: 1, textAlignment: 1 },
};

export function adjustLabelPlacement({
    isUpward,
    isVertical,
    placement,
    spacing = 0,
    rect,
}: {
    placement: BarLabelPlacement;
    isUpward: boolean;
    isVertical: boolean;
    spacing?: PixelSize;
    rect: Bounds;
}): Omit<LabelDatum, 'text'> {
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    let textAlign: CanvasTextAlign = 'center';
    let textBaseline: CanvasTextBaseline = 'middle';

    if (placement !== 'inside-center') {
        const barDirection = (isUpward ? 1 : -1) * (isVertical ? -1 : 1);
        const { direction, textAlignment } = placements[placement];
        const displacementRatio = (direction + 1) * 0.5;

        if (isVertical) {
            const y0 = isUpward ? rect.y + rect.height : rect.y;
            const height = rect.height * barDirection;
            y = y0 + height * displacementRatio + spacing * textAlignment * barDirection;
            textBaseline = textAlignment === barDirection ? 'top' : 'bottom';
        } else {
            const x0 = isUpward ? rect.x : rect.x + rect.width;
            const width = rect.width * barDirection;
            x = x0 + width * displacementRatio + spacing * textAlignment * barDirection;
            textAlign = textAlignment === barDirection ? 'left' : 'right';
        }
    }

    return { x, y, textAlign, textBaseline };
}
