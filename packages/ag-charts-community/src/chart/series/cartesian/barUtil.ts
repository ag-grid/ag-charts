import { isNumber } from '../../../util/value';
import type { Point } from '../../../scene/point';
import type { AgBarSeriesFormat, FontFamily, FontWeight, FontStyle, AgBarSeriesOptions } from '../../agChartOptions';
import type { Rect } from '../../../scene/shape/rect';
import type { DropShadow } from '../../../scene/dropShadow';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';
import type { SeriesItemHighlightStyle } from '../series';
import type { Text } from '../../../scene/shape/text';
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

export type RectConfig = {
    fill: string;
    stroke: string;
    strokeWidth: number;
    fillOpacity: number;
    strokeOpacity: number;
    lineDashOffset: number;
    lineDash?: number[];
    fillShadow?: DropShadow;
    crisp?: boolean;
    visible?: boolean;
};

export type LabelConfig = {
    enabled: boolean;
    fontFamily: FontFamily;
    fontSize: number;
    fontWeight?: FontWeight;
    fontStyle?: FontStyle;
    color?: string;
};

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

export function updateRect({ rect, config }: { rect: Rect; config: RectConfig }) {
    const {
        crisp = true,
        fill,
        stroke,
        strokeWidth,
        fillOpacity,
        strokeOpacity,
        lineDash,
        lineDashOffset,
        fillShadow,
        visible = true,
    } = config;
    rect.crisp = crisp;
    rect.fill = fill;
    rect.stroke = stroke;
    rect.strokeWidth = strokeWidth;
    rect.fillOpacity = fillOpacity;
    rect.strokeOpacity = strokeOpacity;
    rect.lineDash = lineDash;
    rect.lineDashOffset = lineDashOffset;
    rect.fillShadow = fillShadow;
    rect.visible = visible;
}

interface NodeDatum extends Omit<CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {}

export function getRectConfig<
    Params extends Omit<Parameters<NonNullable<AgBarSeriesOptions['formatter']>>[0], 'yKey' | 'value'>,
    ExtraParams extends {}
>({
    datum,
    isHighlighted,
    style,
    highlightStyle,
    formatter,
    seriesId,
    stackGroup,
    ctx: { callbackCache },
    ...opts
}: {
    datum: NodeDatum;
    isHighlighted: boolean;
    style: RectConfig;
    highlightStyle: SeriesItemHighlightStyle;
    formatter?: (params: Params & ExtraParams) => AgBarSeriesFormat;
    seriesId: string;
    stackGroup?: string;
    ctx: ModuleContext;
} & ExtraParams): RectConfig {
    const itemFill = isHighlighted ? highlightStyle.fill ?? style.fill : style.fill;
    const itemStroke = isHighlighted ? highlightStyle.stroke ?? style.stroke : style.stroke;
    const itemStrokeWidth = isHighlighted ? highlightStyle.strokeWidth ?? style.strokeWidth : style.strokeWidth;
    const fillOpacity = isHighlighted ? highlightStyle.fillOpacity ?? style.fillOpacity : style.fillOpacity;
    const { strokeOpacity, fillShadow, lineDash, lineDashOffset } = style;

    let format: AgBarSeriesFormat | undefined = undefined;
    if (formatter) {
        format = callbackCache.call(formatter as any, {
            datum: datum.datum,
            xKey: datum.xKey,
            fill: itemFill,
            stroke: itemStroke,
            strokeWidth: itemStrokeWidth,
            highlighted: isHighlighted,
            seriesId,
            stackGroup,
            ...opts,
        });
    }

    return {
        fill: format?.fill ?? itemFill,
        stroke: format?.stroke ?? itemStroke,
        strokeWidth: format?.strokeWidth ?? itemStrokeWidth,
        fillOpacity,
        strokeOpacity,
        lineDash,
        lineDashOffset,
        fillShadow,
    };
}

export function checkCrisp(visibleRange: number[] = []): boolean {
    const [visibleMin, visibleMax] = visibleRange;
    const isZoomed = visibleMin !== 0 || visibleMax !== 1;
    return !isZoomed;
}

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

/**
 *  Used to calculate the bandwidth when the axis is continuous
 * */
export function calculateStep(range: number, domain: number, smallestInterval?: number): number | undefined {
    const intervals = domain / (smallestInterval ?? 1) + 1;

    // The number of intervals/bands is used to determine the width of individual bands by dividing the available range.
    // Allow a maximum number of bands to ensure the step does not fall below 1 pixel.
    // This means there could be some overlap of the bands in the chart.
    const maxBands = Math.floor(range); // A minimum of 1px per bar/column means the maximum number of bands will equal the available range
    const bands = Math.min(intervals, maxBands);

    return range / Math.max(1, bands);
}
