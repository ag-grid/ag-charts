import type { IsAny } from 'ag-charts-core';

import type { Point } from '../../../scene/point';
import type { Text } from '../../../scene/shape/text';
import type { Label } from '../../label';
import type { ISeries, SeriesNodeDatum } from '../seriesTypes';

type SeriesLike = Pick<ISeries<unknown, SeriesNodeDatum<unknown>, unknown, unknown>, 'getLabelStyles'>;

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type BarLabelPlacement = 'inside-center' | 'inside-start' | 'inside-end' | 'outside-start' | 'outside-end';

type LabelDatum = Point & {
    datum?: unknown;
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
};

// Enforce that D must not be `any`
export function updateLabelNode<TParams, D extends LabelDatum>(
    series: IsAny<D> extends false ? SeriesLike : never,
    textNode: IsAny<D> extends false ? Text : never,
    params: IsAny<D> extends false ? TParams : never,
    label: IsAny<D> extends false ? Label<TParams, unknown> : never,
    labelDatum: D | undefined
): void;

export function updateLabelNode<TParams>(
    series: SeriesLike,
    textNode: Text,
    params: TParams,
    label: Label<TParams, unknown>,
    labelDatum: LabelDatum | undefined
) {
    if (label.enabled && labelDatum) {
        const style = series.getLabelStyles<TParams>(labelDatum, params, label);
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
    padding = 0,
    rect,
}: {
    placement: BarLabelPlacement;
    isUpward: boolean;
    isVertical: boolean;
    padding?: number;
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
            y = y0 + height * displacementRatio + padding * textAlignment * barDirection;
            textBaseline = textAlignment === barDirection ? 'top' : 'bottom';
        } else {
            const x0 = isUpward ? rect.x : rect.x + rect.width;
            const width = rect.width * barDirection;
            x = x0 + width * displacementRatio + padding * textAlignment * barDirection;
            textAlign = textAlignment === barDirection ? 'left' : 'right';
        }
    }

    return { x, y, textAlign, textBaseline };
}
