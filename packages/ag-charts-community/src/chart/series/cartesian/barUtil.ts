import type { ModuleContext } from '../../../module/moduleContext';
import type { AgBarSeriesFormat, AgBarSeriesOptions } from '../../../options/agChartOptions';
import type { DropShadow } from '../../../scene/dropShadow';
import type { Rect } from '../../../scene/shape/rect';
import type { SeriesItemHighlightStyle } from '../series';
import type { CartesianSeriesNodeDatum } from './cartesianSeries';

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
    ExtraParams extends {},
>({
    datum,
    isHighlighted,
    style,
    highlightStyle,
    formatter,
    seriesId,
    ctx: { callbackCache },
    ...opts
}: {
    datum: NodeDatum;
    isHighlighted: boolean;
    style: RectConfig;
    highlightStyle: SeriesItemHighlightStyle;
    formatter?: (params: Params & ExtraParams) => AgBarSeriesFormat;
    seriesId: string;
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
