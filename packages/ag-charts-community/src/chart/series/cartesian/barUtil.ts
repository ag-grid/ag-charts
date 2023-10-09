import type { ModuleContext } from '../../../module/moduleContext';
import { ADD_PHASE, INITIAL_LOAD, REMOVE_PHASE, UPDATE_PHASE } from '../../../motion/animation';
import { FROM_TO_MIXINS, type NodeUpdateState } from '../../../motion/fromToMotion';
import type { AgBarSeriesFormatterParams, AgBarSeriesStyle } from '../../../options/agChartOptions';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { DropShadow } from '../../../scene/dropShadow';
import type { Rect } from '../../../scene/shape/rect';
import { isNegative } from '../../../util/number';
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
    Params extends Omit<AgBarSeriesFormatterParams<any>, 'yKey' | 'value'>,
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
    formatter?: (params: Params & ExtraParams) => AgBarSeriesStyle;
    seriesId: string;
    ctx: ModuleContext;
} & ExtraParams): RectConfig {
    const itemFill = isHighlighted ? highlightStyle.fill ?? style.fill : style.fill;
    const itemStroke = isHighlighted ? highlightStyle.stroke ?? style.stroke : style.stroke;
    const itemStrokeWidth = isHighlighted ? highlightStyle.strokeWidth ?? style.strokeWidth : style.strokeWidth;
    const fillOpacity = isHighlighted ? highlightStyle.fillOpacity ?? style.fillOpacity : style.fillOpacity;
    const { strokeOpacity, fillShadow, lineDash, lineDashOffset } = style;

    let format: AgBarSeriesStyle | undefined;
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

type InitialPosition<T> = { isVertical: boolean; calculate: (datum: T, prevDatum?: T) => T };
export function collapsedStartingBarPosition(
    barDirection: ChartAxisDirection,
    axes: Record<ChartAxisDirection, ChartAxis | undefined>
): InitialPosition<AnimatableBarDatum> {
    const isVertical = barDirection === ChartAxisDirection.Y;
    const { startingX, startingY } = getBarDirectionStartingValues(barDirection, axes);

    const isDatumPositive = (datum: AnimatableBarDatum) => {
        return !isNegative((datum as any)['xValue'] ?? 0);
    };

    const calculate = (datum: AnimatableBarDatum, prevDatum?: AnimatableBarDatum) => {
        let x = isVertical ? datum.x : startingX;
        let y = isVertical ? startingY : datum.y;
        let width = isVertical ? datum.width : 0;
        let height = isVertical ? 0 : datum.height;

        if (prevDatum && (isNaN(x) || isNaN(y))) {
            // Fallback
            ({ x, y } = prevDatum);
            width = isVertical ? prevDatum.width : 0;
            height = isVertical ? 0 : prevDatum.height;
            if (isDatumPositive(prevDatum) === isVertical) {
                x += isVertical ? 0 : prevDatum.width;
                y += isVertical ? prevDatum.height : 0;
            }
        }
        return { x, y, width, height };
    };

    return {
        isVertical,
        calculate,
    };
}

export function midpointStartingBarPosition(barDirection: ChartAxisDirection): InitialPosition<AnimatableBarDatum> {
    const isVertical = barDirection === ChartAxisDirection.Y;

    return {
        isVertical,
        calculate: (datum) => {
            return {
                x: isVertical ? datum.x : datum.x + datum.width / 2,
                y: isVertical ? datum.y + datum.height / 2 : datum.y,
                width: isVertical ? datum.width : 0,
                height: isVertical ? 0 : datum.height,
            };
        },
    };
}

type AnimatableBarDatum = { x: number; y: number; height: number; width: number };
export function prepareBarAnimationFunctions<T extends AnimatableBarDatum>(initPos: InitialPosition<T>) {
    const isRemoved = (datum: T) => {
        return isNaN(datum.x) || isNaN(datum.y);
    };

    const fromFn = (rect: Rect, datum: T, status: NodeUpdateState) => {
        if (status === 'updated' && isRemoved(datum)) {
            status = 'removed';
        } else if (status === 'updated' && isRemoved(rect.previousDatum)) {
            status = 'added';
        }

        // Continue from current rendering location.
        let source = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        if (status === 'unknown' || status === 'added') {
            source = initPos.calculate(datum, rect.previousDatum);
        }
        return { ...source, ...FROM_TO_MIXINS[status] };
    };
    const toFn = (rect: Rect, datum: T, status: NodeUpdateState) => {
        if (status === 'removed' || isRemoved(datum)) {
            return initPos.calculate(datum, rect.previousDatum);
        }
        return { x: datum.x, y: datum.y, width: datum.width, height: datum.height };
    };

    return { toFn, fromFn };
}

function getBarDirectionStartingValues(
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

export function resetBarSelectionsFn(_node: Rect, { x, y, width, height }: AnimatableBarDatum) {
    return {
        x,
        y,
        width,
        height,
    };
}
