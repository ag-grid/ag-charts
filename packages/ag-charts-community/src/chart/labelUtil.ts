import type { Callback, CallbackParam, IsAny, Point, RequireOptional } from 'ag-charts-core';
import { mergeDefaults } from 'ag-charts-core';
import type {
    AgChartLabelStyleOptions,
    AgChartLabelStylerParams,
    HighlightState,
    PixelSize,
    TextOrSegments,
} from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { ModuleContext } from '../module/moduleContext';
import type { Text } from '../scene/shape/text';
import type { Label } from './label';
import type { DatumIndexType, SeriesNodeDatum } from './series/seriesTypes';

interface SeriesLike<TDatumIndex extends DatumIndexType> {
    id: string;
    ctx: ModuleContext;
    declarationOrder: number;
    get visible(): boolean;
    cachedCallWithContext<F extends Callback>(fn: F, params: CallbackParam<F>): ReturnType<F> | undefined;
    isSeriesHighlighted(highlightedDatum: HighlightNodeDatum | undefined): boolean;
    getHighlightStateString(
        datum: HighlightNodeDatum | undefined,
        isHighlight?: boolean,
        datumIndex?: TDatumIndex
    ): HighlightState;
}

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type BarLabelPlacement = 'inside-center' | 'inside-start' | 'inside-end' | 'outside-start' | 'outside-end';

type LabelDatum = Point & {
    text: TextOrSegments;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
};

export function getLabelStyles<TParams, TDatumIndex extends DatumIndexType = DatumIndexType>(
    series: SeriesLike<TDatumIndex>,
    nodeDatum: SeriesNodeDatum<TDatumIndex> | undefined,
    params: TParams,
    label: Label<TParams>,
    isHighlight: boolean,
    activeHighlight: HighlightNodeDatum<TDatumIndex> | undefined
): AgChartLabelStyleOptions & { fontSize: number } {
    if (series.visible && label.itemStyler) {
        const highlightState = series.getHighlightStateString(
            activeHighlight,
            isHighlight ||
                (nodeDatum != null &&
                    activeHighlight?.series === nodeDatum.series &&
                    activeHighlight?.datumIndex === nodeDatum.datumIndex),
            nodeDatum?.datumIndex
        );

        const styleParams: RequireOptional<Omit<AgChartLabelStylerParams<unknown, unknown>, 'context'>> & {
            fontSize: number;
        } = {
            border: label.border,
            color: label.color,
            cornerRadius: label.cornerRadius,
            datum: nodeDatum?.datum,
            enabled: label.enabled,
            fill: label.fill,
            fillOpacity: label.fillOpacity,
            fontFamily: label.fontFamily,
            fontSize: label.fontSize,
            fontStyle: label.fontStyle,
            fontWeight: label.fontWeight,
            itemId: nodeDatum?.itemId,
            itemType: nodeDatum?.itemType,
            seriesId: series.id,
            padding: label.padding,
            highlightState,
        };
        const stylerResult =
            series.ctx.optionsGraphService.resolvePartial(
                ['series', `${series.declarationOrder}`, 'label'],
                series.cachedCallWithContext(label.itemStyler, { ...params, ...styleParams }),
                { pick: false }
            ) ?? {};

        return mergeDefaults(stylerResult, styleParams);
    }

    return label;
}

// Enforce that D must not be `any`
export function updateLabelNode<TParams, D extends LabelDatum>(
    series: IsAny<D> extends false ? SeriesLike<DatumIndexType> : never,
    textNode: IsAny<D> extends false ? Text : never,
    params: IsAny<D> extends false ? TParams : never,
    label: IsAny<D> extends false ? Label<TParams, unknown> : never,
    labelDatum: D | undefined,
    isHighlight: boolean,
    activeHighlight: HighlightNodeDatum<DatumIndexType> | undefined
): void;

export function updateLabelNode<TParams>(
    series: SeriesLike<DatumIndexType>,
    textNode: Text<SeriesNodeDatum<DatumIndexType>>,
    params: TParams,
    label: Label<TParams, unknown>,
    labelDatum: LabelDatum | undefined,
    isHighlight: boolean,
    activeHighlight: HighlightNodeDatum<DatumIndexType> | undefined
) {
    if (series.visible && label.enabled && labelDatum) {
        const style = getLabelStyles(series, textNode.datum, params, label, isHighlight, activeHighlight);
        textNode.visible = true;
        textNode.x = labelDatum.x;
        textNode.y = labelDatum.y;
        textNode.text = labelDatum.text;
        textNode.fill = style.color;
        textNode.setAlign(labelDatum);
        textNode.setFont(style);
        textNode.setBoxing(style);
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
