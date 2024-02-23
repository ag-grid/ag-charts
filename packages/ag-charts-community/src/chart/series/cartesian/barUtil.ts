import type { ModuleContext } from '../../../module/moduleContext';
import type { FromToMotionPropFn, NodeUpdateState } from '../../../motion/fromToMotion';
import { NODE_UPDATE_STATE_TO_PHASE_MAPPING } from '../../../motion/fromToMotion';
import type { AgBarSeriesFormatterParams, AgBarSeriesStyle } from '../../../options/agChartOptions';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import type { DropShadow } from '../../../scene/dropShadow';
import type { Rect } from '../../../scene/shape/rect';
import { isNegative } from '../../../util/number';
import { mergeDefaults } from '../../../util/object';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { SeriesItemHighlightStyle } from '../seriesProperties';
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
    cornerRadius?: number;
    topLeftCornerRadius?: boolean;
    topRightCornerRadius?: boolean;
    bottomRightCornerRadius?: boolean;
    bottomLeftCornerRadius?: boolean;
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
        cornerRadius = 0,
        topLeftCornerRadius = true,
        topRightCornerRadius = true,
        bottomRightCornerRadius = true,
        bottomLeftCornerRadius = true,
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
    rect.topLeftCornerRadius = topLeftCornerRadius ? cornerRadius : 0;
    rect.topRightCornerRadius = topRightCornerRadius ? cornerRadius : 0;
    rect.bottomRightCornerRadius = bottomRightCornerRadius ? cornerRadius : 0;
    rect.bottomLeftCornerRadius = bottomLeftCornerRadius ? cornerRadius : 0;
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
    const {
        strokeOpacity,
        fillShadow,
        lineDash,
        lineDashOffset,
        cornerRadius = 0,
        topLeftCornerRadius = true,
        topRightCornerRadius = true,
        bottomRightCornerRadius = true,
        bottomLeftCornerRadius = true,
    } = style;

    let format: AgBarSeriesStyle | undefined;
    if (formatter) {
        format = callbackCache.call(formatter as any, {
            datum: datum.datum,
            xKey: datum.xKey,
            fill,
            stroke,
            strokeWidth,
            cornerRadius,
            highlighted: isHighlighted,
            seriesId,
            ...opts,
        });
    }

    return {
        fill: format?.fill ?? fill,
        stroke: format?.stroke ?? stroke,
        strokeWidth: format?.strokeWidth ?? strokeWidth,
        fillOpacity: format?.fillOpacity ?? fillOpacity,
        strokeOpacity: format?.strokeOpacity ?? strokeOpacity,
        lineDash,
        lineDashOffset,
        fillShadow,
        cornerRadius: format?.cornerRadius ?? cornerRadius,
        topLeftCornerRadius,
        topRightCornerRadius,
        bottomRightCornerRadius,
        bottomLeftCornerRadius,
    };
}

export function checkCrisp(visibleRange: number[] = []): boolean {
    const [visibleMin, visibleMax] = visibleRange;
    const isZoomed = visibleMin !== 0 || visibleMax !== 1;
    return !isZoomed;
}

const isDatumNegative = (datum: AnimatableBarDatum) => {
    return isNegative((datum as any).yValue ?? 0);
};

type InitialPosition<T> = {
    isVertical: boolean;
    mode: 'normal' | 'fade';
    calculate: (datum: T, prevDatum?: T) => T;
};
export function collapsedStartingBarPosition(
    isVertical: boolean,
    axes: Record<ChartAxisDirection, ChartAxis | undefined>,
    mode: 'normal' | 'fade'
): InitialPosition<AnimatableBarDatum> {
    const { startingX, startingY } = getStartingValues(isVertical, axes);

    const calculate = (datum: AnimatableBarDatum, prevDatum?: AnimatableBarDatum) => {
        let x = isVertical ? datum.x : startingX;
        let y = isVertical ? startingY : datum.y;
        let width = isVertical ? datum.width : 0;
        let height = isVertical ? 0 : datum.height;
        const { opacity } = datum;

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

        let cornerRadiusBbox: BBox | undefined;
        if (datum.cornerRadiusBbox == null) {
            cornerRadiusBbox = undefined;
        } else if (isDatumNegative(datum)) {
            cornerRadiusBbox = isVertical
                ? new BBox(x, y - height, width, height)
                : new BBox(x - width, y, width, height);
        } else {
            cornerRadiusBbox = new BBox(x, y, width, height);
        }

        return { x, y, width, height, cornerRadiusBbox, opacity };
    };

    return { isVertical, calculate, mode };
}

export function midpointStartingBarPosition(
    isVertical: boolean,
    mode: 'normal' | 'fade'
): InitialPosition<AnimatableBarDatum> {
    return {
        isVertical,
        calculate: (datum) => {
            return {
                x: isVertical ? datum.x : datum.x + datum.width / 2,
                y: isVertical ? datum.y + datum.height / 2 : datum.y,
                width: isVertical ? datum.width : 0,
                height: isVertical ? 0 : datum.height,
                cornerRadiusBbox: datum.cornerRadiusBbox,
                opacity: datum.opacity,
            };
        },
        mode,
    };
}

type AnimatableBarDatum = {
    x: number;
    y: number;
    height: number;
    width: number;
    cornerRadiusBbox?: BBox;
    opacity?: number;
};
export function prepareBarAnimationFunctions<T extends AnimatableBarDatum>(initPos: InitialPosition<T>) {
    const isRemoved = (datum?: T) => datum == null || isNaN(datum.x) || isNaN(datum.y);

    const fromFn: FromToMotionPropFn<Rect, AnimatableBarDatum, T> = (rect: Rect, datum: T, status: NodeUpdateState) => {
        if (status === 'updated' && isRemoved(datum)) {
            status = 'removed';
        } else if (status === 'updated' && isRemoved(rect.previousDatum)) {
            status = 'added';
        }

        // Continue from current rendering location.
        let source: AnimatableBarDatum;
        if (status === 'added' && rect.previousDatum == null && initPos.mode === 'fade') {
            // Handle series add case, after initial load. This is distinct from legend toggle on.
            source = { ...resetBarSelectionsFn(rect, datum), opacity: 0 };
        } else if (status === 'unknown' || status === 'added') {
            source = initPos.calculate(datum, rect.previousDatum);
        } else {
            source = {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                cornerRadiusBbox: rect.cornerRadiusBbox,
                opacity: rect.opacity,
            };
        }

        const phase = NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
        return { ...source, phase };
    };
    const toFn: FromToMotionPropFn<Rect, AnimatableBarDatum, T> = (rect: Rect, datum: T, status: NodeUpdateState) => {
        let source: AnimatableBarDatum;
        if (status === 'removed' && rect.datum == null && initPos.mode === 'fade') {
            // Handle series remove case, after initial load. This is distinct from legend toggle off.
            source = { ...resetBarSelectionsFn(rect, datum), opacity: 0 };
        } else if (status === 'removed' || isRemoved(datum)) {
            source = initPos.calculate(datum, rect.previousDatum);
        } else {
            source = {
                x: datum.x,
                y: datum.y,
                width: datum.width,
                height: datum.height,
                cornerRadiusBbox: datum.cornerRadiusBbox,
                opacity: datum.opacity,
            };
        }

        return source;
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

export function resetBarSelectionsFn(
    _node: Rect,
    { x, y, width, height, cornerRadiusBbox, opacity }: AnimatableBarDatum
) {
    return { x, y, width, height, cornerRadiusBbox, opacity };
}
