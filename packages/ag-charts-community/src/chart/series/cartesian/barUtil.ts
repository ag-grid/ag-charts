import type { ModuleContext } from '../../../module/moduleContext';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import type { AgBarSeriesFormat, AgBarSeriesOptions } from '../../../options/agChartOptions';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { DropShadow } from '../../../scene/dropShadow';
import type { Rect } from '../../../scene/shape/rect';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
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

type AnimatableBarDatum = { x: number; y: number; height: number; width: number };
export function prepareBarAnimationFunctions<T extends AnimatableBarDatum>(
    isVertical: boolean,
    startingX = 0,
    startingY = 0
) {
    const fromFn = (rect: Rect, datum: T, status: NodeUpdateState) => {
        if (status === 'removed') {
            return { x: datum.x, y: datum.y, width: datum.width, height: datum.height };
        } else if (status === 'added') {
            return {
                x: isVertical ? datum.x : startingX,
                y: isVertical ? startingY : datum.y,
                width: isVertical ? datum.width : 0,
                height: isVertical ? 0 : datum.height,
            };
        }
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    const toFn = (_rect: Rect, datum: T, status: NodeUpdateState) => {
        if (status === 'removed') {
            return {
                x: isVertical ? datum.x : startingX,
                y: isVertical ? startingY : datum.y,
                width: isVertical ? datum.width : 0,
                height: isVertical ? 0 : datum.height,
            };
        }
        return { x: datum.x, y: datum.y, width: datum.width, height: datum.height };
    };

    return { toFn, fromFn };
}

export function getBarDirectionStartingValues(
    barDirection: ChartAxisDirection,
    axes: Record<ChartAxisDirection, ChartAxis | undefined>
) {
    const isColumnSeries = barDirection === ChartAxisDirection.Y;

    const xAxis = axes[ChartAxisDirection.X];
    const yAxis = axes[ChartAxisDirection.Y];

    let startingX = Infinity;
    let startingY = 0;

    if (isColumnSeries) {
        const isContinuousY = yAxis?.scale instanceof ContinuousScale;
        if (isContinuousY) {
            startingY = yAxis.scale.convert(0);
        } else if (yAxis) {
            startingY = yAxis.scale.convert(Math.max(...yAxis.range));
        }
    } else {
        const isContinuousX = xAxis?.scale instanceof ContinuousScale;
        if (isContinuousX) {
            startingX = xAxis.scale.convert(0);
        } else if (xAxis) {
            startingX = xAxis.scale.convert(Math.min(...xAxis.range));
        }
    }

    return { startingX, startingY };
}
