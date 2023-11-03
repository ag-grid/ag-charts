import type { ModuleContext } from '../../../module/moduleContext';
import type { NodeUpdateState } from '../../../motion/fromToMotion';
import { FROM_TO_MIXINS } from '../../../motion/fromToMotion';
import type { AgBarSeriesFormatterParams, AgBarSeriesStyle } from '../../../options/agChartOptions';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { DropShadow } from '../../../scene/dropShadow';
import type { Rect } from '../../../scene/shape/rect';
import { isNegative } from '../../../util/number';
import { mergeDefaults } from '../../../util/object';
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
    const { fill, fillOpacity, stroke, strokeWidth } = mergeDefaults(isHighlighted && highlightStyle, style);
    const { strokeOpacity, fillShadow, lineDash, lineDashOffset } = style;

    let format: AgBarSeriesStyle | undefined;
    if (formatter) {
        format = callbackCache.call(formatter as any, {
            datum: datum.datum,
            xKey: datum.xKey,
            fill,
            stroke,
            strokeWidth,
            highlighted: isHighlighted,
            seriesId,
            ...opts,
        });
    }

    return {
        fill: format?.fill ?? fill,
        stroke: format?.stroke ?? stroke,
        strokeWidth: format?.strokeWidth ?? strokeWidth,
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
    isVertical: boolean,
    axes: Record<ChartAxisDirection, ChartAxis | undefined>
): InitialPosition<AnimatableBarDatum> {
    const { startingX, startingY } = getStartingValues(isVertical, axes);

    const isDatumNegative = (datum: AnimatableBarDatum) => {
        return isNegative((datum as any)['yValue'] ?? 0);
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
            if (isVertical && !isDatumNegative(prevDatum)) {
                y += prevDatum.height;
            } else if (!isVertical && isDatumNegative(prevDatum)) {
                x += prevDatum.width;
            }
        }
        return { x, y, width, height };
    };

    return { isVertical, calculate };
}

export function midpointStartingBarPosition(isVertical: boolean): InitialPosition<AnimatableBarDatum> {
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
    const isRemoved = (datum?: T) => datum == null || isNaN(datum.x) || isNaN(datum.y);

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

function getStartingValues(isVertical: boolean, axes: Record<ChartAxisDirection, ChartAxis | undefined>) {
    const axis = axes[isVertical ? ChartAxisDirection.Y : ChartAxisDirection.X];

    let startingX = Infinity;
    let startingY = 0;

    if (!axis) {
        return { startingX, startingY };
    }

    if (isVertical) {
        startingY = axis.scale.convert(ContinuousScale.is(axis.scale) ? 0 : Math.max(...axis.range));
    } else {
        startingX = axis.scale.convert(ContinuousScale.is(axis.scale) ? 0 : Math.min(...axis.range));
    }

    return { startingX, startingY };
}

export function resetBarSelectionsFn(_node: Rect, { x, y, width, height }: AnimatableBarDatum) {
    return { x, y, width, height };
}
