import type { AgChartLabelOptions } from 'ag-charts-types';

import type { Point } from '../../../scene/point';
import type { Text } from '../../../scene/shape/text';

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type LabelPlacement = 'start' | 'end' | 'inside' | 'outside';

type LabelDatum = Point & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
};

export function updateLabelNode(textNode: Text, label: AgChartLabelOptions<any, any>, labelDatum?: LabelDatum) {
    if (label.enabled && labelDatum) {
        const { x, y, text, textAlign, textBaseline } = labelDatum;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = label;
        textNode.setProperties({
            visible: true,
            x,
            y,
            text,
            fill,
            fontStyle,
            fontWeight,
            fontSize,
            fontFamily,
            textAlign,
            textBaseline,
        });
    } else {
        textNode.visible = false;
    }
}

export function adjustLabelPlacement({
    isPositive,
    isVertical,
    placement,
    padding = 0,
    rect,
}: {
    placement: LabelPlacement;
    isPositive: boolean;
    isVertical: boolean;
    padding?: number;
    rect: Bounds;
}): Omit<LabelDatum, 'text'> {
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    let textAlign: CanvasTextAlign = 'center';
    let textBaseline: CanvasTextBaseline = 'middle';

    switch (placement) {
        case 'start': {
            if (isVertical) {
                y = isPositive ? rect.y + rect.height + padding : rect.y - padding;
                textBaseline = isPositive ? 'top' : 'bottom';
            } else {
                x = isPositive ? rect.x - padding : rect.x + rect.width + padding;
                textAlign = isPositive ? 'start' : 'end';
            }
            break;
        }
        case 'outside':
        case 'end': {
            if (isVertical) {
                y = isPositive ? rect.y - padding : rect.y + rect.height + padding;
                textBaseline = isPositive ? 'bottom' : 'top';
            } else {
                x = isPositive ? rect.x + rect.width + padding : rect.x - padding;
                textAlign = isPositive ? 'start' : 'end';
            }
            break;
        }
    }

    return { x, y, textAlign, textBaseline };
}
