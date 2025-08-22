import type { AnyFn, IsAny, Point, RequireOptional } from 'ag-charts-core';
import type { AgChartLabelStyleOptions, AgChartLabelStylerParams, HighlightState, PixelSize } from 'ag-charts-types';

import type { Text } from '../scene/shape/text';
import { mergeDefaults } from '../util/object';
import type { Label } from './label';
import type { SeriesNodeDatum } from './series/seriesTypes';

interface SeriesLike {
    id: string;
    callWithContext<F extends AnyFn>(fn: F, ...params: Parameters<F>): ReturnType<F>;
}

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type BarLabelPlacement = 'inside-center' | 'inside-start' | 'inside-end' | 'outside-start' | 'outside-end';

type LabelDatum = Point & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
};

export function getLabelStyles<TParams>(
    series: SeriesLike,
    nodeDatum: SeriesNodeDatum<unknown> | undefined,
    params: TParams,
    label: Label<TParams>,
    highlighted?: boolean,
    highlightState?: HighlightState
): AgChartLabelStyleOptions & { fontSize: number } {
    if (label.itemStyler) {
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
            itemId: undefined,
            seriesId: series.id,
            padding: label.padding,
            highlighted,
            highlightState,
        };
        return mergeDefaults(series.callWithContext(label.itemStyler, { ...params, ...styleParams }), styleParams);
    }

    return label;
}

// Enforce that D must not be `any`
export function updateLabelNode<TParams, D extends LabelDatum>(
    series: IsAny<D> extends false ? SeriesLike : never,
    textNode: IsAny<D> extends false ? Text : never,
    params: IsAny<D> extends false ? TParams : never,
    label: IsAny<D> extends false ? Label<TParams, unknown> : never,
    labelDatum: D | undefined,
    highlighted?: boolean,
    highlightState?: HighlightState
): void;

export function updateLabelNode<TParams>(
    series: SeriesLike,
    textNode: Text<SeriesNodeDatum<unknown>>,
    params: TParams,
    label: Label<TParams, unknown>,
    labelDatum: LabelDatum | undefined,
    highlighted?: boolean,
    highlightState?: HighlightState
) {
    if (label.enabled && labelDatum) {
        const style = getLabelStyles<TParams>(series, textNode.datum, params, label, highlighted, highlightState);
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
