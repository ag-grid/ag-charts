import type { FontFamily, FontStyle, FontWeight } from '../../../options/agChartOptions';
import type { Point } from '../../../scene/point';
import type { Text } from '../../../scene/shape/text';

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type LabelPlacement = 'start' | 'end' | 'inside' | 'outside';

type LabelDatum = Readonly<Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
};

export type LabelConfig = {
    enabled: boolean;
    fontFamily: FontFamily;
    fontSize: number;
    fontWeight?: FontWeight;
    fontStyle?: FontStyle;
    color?: string;
};

export function updateLabel<LabelDatumType extends LabelDatum>({
    labelNode,
    labelDatum,
    config,
    visible,
}: {
    labelNode: Text;
    labelDatum?: LabelDatumType;
    config?: LabelConfig;
    visible: boolean;
}) {
    if (labelDatum && config && config.enabled) {
        const { x, y, text, textAlign, textBaseline } = labelDatum;
        const { fontStyle, fontWeight, fontSize, fontFamily, color } = config;
        labelNode.setProperties({
            visible,
            x,
            y,
            text,
            fill: color,
            fontStyle,
            fontWeight,
            fontSize,
            fontFamily,
            textAlign,
            textBaseline,
        });
    } else {
        labelNode.visible = false;
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
