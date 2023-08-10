import type { Text } from '../../../scene/shape/text';
import type { Point } from '../../../scene/point';
import { isNumber } from '../../../util/value';
import type { FontFamily, FontWeight, FontStyle } from '../../agChartOptions';
import type { ModuleContext } from '../../../util/moduleContext';

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
        labelNode.fontStyle = fontStyle;
        labelNode.fontWeight = fontWeight;
        labelNode.fontSize = fontSize;
        labelNode.fontFamily = fontFamily;
        labelNode.textAlign = textAlign;
        labelNode.textBaseline = textBaseline;
        labelNode.text = text;
        labelNode.x = x;
        labelNode.y = y;
        labelNode.fill = color;
        labelNode.visible = visible;
    } else {
        labelNode.visible = false;
    }
}

export function createLabelData<FormatterParams, ExtraParams extends {}>({
    value,
    rect,
    placement,
    seriesId,
    padding = 0,
    formatter,
    barAlongX,
    ctx: { callbackCache },
    ...opts
}: {
    value: any;
    rect: Bounds;
    placement: LabelPlacement;
    seriesId: string;
    padding?: number;
    formatter?: (params: FormatterParams) => string;
    ctx: ModuleContext;
    barAlongX: boolean;
} & ExtraParams): LabelDatum {
    let labelText;
    if (formatter) {
        labelText = callbackCache.call(formatter as any, {
            value: isNumber(value) ? value : undefined,
            seriesId,
            ...opts,
        });
    }
    if (labelText === undefined) {
        labelText = isNumber(value) ? value.toFixed(2) : '';
    }

    let labelX = rect.x + rect.width / 2;
    let labelY = rect.y + rect.height / 2;

    let labelTextAlign: CanvasTextAlign = 'center';
    let labelTextBaseline: CanvasTextBaseline = 'middle';

    const isPositive = value >= 0;
    switch (placement) {
        case 'start': {
            if (barAlongX) {
                labelX = isPositive ? rect.x - padding : rect.x + rect.width + padding;
                labelTextAlign = isPositive ? 'start' : 'end';
            } else {
                labelY = isPositive ? rect.y + rect.height + padding : rect.y - padding;
                labelTextBaseline = isPositive ? 'top' : 'bottom';
            }
            break;
        }
        case 'outside':
        case 'end': {
            if (barAlongX) {
                labelX = isPositive ? rect.x + rect.width + padding : rect.x - padding;
                labelTextAlign = isPositive ? 'start' : 'end';
            } else {
                labelY = isPositive ? rect.y - padding : rect.y + rect.height + padding;
                labelTextBaseline = isPositive ? 'bottom' : 'top';
            }
            break;
        }
        case 'inside':
        default: {
            labelTextBaseline = 'middle';
            break;
        }
    }

    return {
        text: labelText,
        textAlign: labelTextAlign,
        textBaseline: labelTextBaseline,
        x: labelX,
        y: labelY,
    };
}
