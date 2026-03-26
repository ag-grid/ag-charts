import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    type Size,
    isArray,
    isDate,
    isEmptyObject,
    isNumber,
    isObject,
    isString,
} from 'ag-charts-core';
import type {
    AgCartesianSeriesOptions,
    AgSeriesSegmentation,
    AgSeriesShapeSegmentOptions,
    DatumDefault,
    SeriesPredictAxis,
} from 'ag-charts-types';

import { BBox } from '../../../scene/bbox';
import type { ChartAxis } from '../../chartAxis';

function isAxisReversed(axis: ChartAxis) {
    return axis.isReversed() !== axis.range[1] < axis.range[0];
}

export function calculateSegments(
    segmentation: AgSeriesSegmentation,
    xAxis: ChartAxis,
    yAxis: ChartAxis,
    seriesRect: BBox,
    chartSize: Size,
    applyOffset: boolean = true
) {
    if (xAxis.scale.domain.length === 0 || yAxis.scale.domain.length === 0) {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    const axis = segmentation.key === ChartAxisDirection.X ? xAxis : yAxis;
    const { scale, direction } = axis;

    const isXDirection = direction === ChartAxisDirection.X;
    const bandwidth = scale.bandwidth ?? 0;
    const offset = applyOffset ? ((scale.step ?? 0) - bandwidth) / 2 : 0;

    // The margin to use to ensure a clip path touches one side of the canvas,
    // and either exceeds or touches the other side.
    // It's required to use a margin here so a reverse-axis animation animates with the same center
    const horizontalMargin = Math.max(seriesRect.x, chartSize.width - (seriesRect.x + seriesRect.width));
    const verticalMargin = Math.max(seriesRect.y, chartSize.height - (seriesRect.y + seriesRect.height));

    const getDefaultStart = () => {
        if (isAxisReversed(isXDirection ? xAxis : yAxis)) {
            return isXDirection ? seriesRect.width + horizontalMargin : seriesRect.height + verticalMargin;
        }
        return isXDirection ? -horizontalMargin : -verticalMargin;
    };

    const getDefaultStop = () => {
        if (isAxisReversed(isXDirection ? xAxis : yAxis)) {
            return isXDirection ? -horizontalMargin : -verticalMargin;
        }
        return isXDirection ? seriesRect.width + horizontalMargin : seriesRect.height + verticalMargin;
    };

    const getSegments = (segments: AgSeriesShapeSegmentOptions[]) => {
        const result: AgSeriesShapeSegmentOptions[] = [];

        let previousDefinedStopIndex = -1;
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (isEmptyObject(segment)) {
                continue;
            }

            const { start, stop, ...styles } = segments[i];

            const startFallback = segments[previousDefinedStopIndex]?.stop;
            const stopFallback = segments.slice(i + 1).find((s) => s.start != null)?.start;

            let startPosition = scale.convert(start ?? startFallback) - offset;
            let stopPosition = scale.convert(stop ?? stopFallback) + 2 * offset;

            const invalidStart = start != null && Number.isNaN(startPosition);
            const invalidStop = stop != null && Number.isNaN(stopPosition);
            if (invalidStart || invalidStop) {
                continue;
            }

            if (Number.isNaN(startPosition)) startPosition = getDefaultStart();
            if (Number.isNaN(stopPosition)) stopPosition = getDefaultStop();

            if (stop != null) {
                previousDefinedStopIndex = i;
            }

            result.push({ start: startPosition, stop: stopPosition, ...styles });
        }

        return result;
    };

    return getSegments(segmentation.segments).map(({ stop, start, ...style }) => {
        // Calculate dimensions based on direction
        const x0 = isXDirection ? start : -horizontalMargin;
        const y0 = isXDirection ? -verticalMargin : start;
        const x1 = isXDirection ? stop + bandwidth : seriesRect.width + horizontalMargin;
        const y1 = isXDirection ? seriesRect.height + verticalMargin : stop + bandwidth;

        return { clipRect: { x0, y0, x1, y1 }, ...style };
    });
}

const TIME_AXIS_KEYS = new Set(['time', 'timestamp', 'date', 'datetime']);

export function predictCartesianAxis<SeriesOptions extends AgCartesianSeriesOptions>(
    direction: ChartAxisDirection,
    datum: DatumDefault,
    seriesOptions: SeriesOptions,
    { allowPrimitiveTypes = true }: { allowPrimitiveTypes?: boolean } = {}
): SeriesPredictAxis<AgCartesianSeriesOptions['type']> | undefined {
    if (direction !== ChartAxisDirection.X && direction !== ChartAxisDirection.Y) return;
    if (!isObject(datum)) return;

    const key = getSeriesOptionsKey(direction, seriesOptions);
    if (key == null || !(key in datum)) return;

    const value = datum[key];
    const position = getAxisPosition(direction, seriesOptions);

    const groupedCategory = predictGroupedCategoryAxisType(value);
    if (groupedCategory) {
        return { type: groupedCategory, position };
    }

    const timeAxis = predictTimeAxisType(key, value);
    if (timeAxis) {
        return { type: timeAxis, position };
    }

    if (!allowPrimitiveTypes) return;

    if (typeof value === 'number') {
        return {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position,
        };
    }

    return {
        type: CARTESIAN_AXIS_TYPE.CATEGORY,
        position,
    };
}

export function predictCartesianNonPrimitiveAxis<SeriesOptions extends AgCartesianSeriesOptions>(
    direction: ChartAxisDirection,
    datum: DatumDefault,
    seriesOptions: SeriesOptions
): SeriesPredictAxis<AgCartesianSeriesOptions['type']> | undefined {
    return predictCartesianAxis(direction, datum, seriesOptions, { allowPrimitiveTypes: false });
}

export function predictCartesianFinancialAxis<SeriesOptions extends AgCartesianSeriesOptions>(
    direction: ChartAxisDirection,
    datum: DatumDefault,
    seriesOptions: SeriesOptions
): SeriesPredictAxis<AgCartesianSeriesOptions['type']> | undefined {
    // Only predict the x-axis.
    if (direction !== ChartAxisDirection.X) return;
    if (!isObject(datum)) return;

    const key = getSeriesOptionsKey(direction, seriesOptions);
    if (key == null || !(key in datum)) return;

    const value = datum[key];
    const position = getAxisPosition(direction, seriesOptions);

    const ordinalTimeAxis = predictOrdinalTimeAxisType(key, value);
    if (ordinalTimeAxis) {
        return { type: ordinalTimeAxis, position };
    }

    if (isString(value)) {
        return { type: 'category', position };
    }
}

function predictGroupedCategoryAxisType(value: unknown) {
    if (isArray(value) && value.every((v) => isString(v) || v === null)) {
        return CARTESIAN_AXIS_TYPE.GROUPED_CATEGORY;
    }
}

function predictTimeAxisType(key: string, value: unknown) {
    if (isDate(value) || (TIME_AXIS_KEYS.has(key) && isNumber(value))) {
        return CARTESIAN_AXIS_TYPE.TIME;
    }
}

function predictOrdinalTimeAxisType(key: string, value: unknown) {
    if (isDate(value) || (TIME_AXIS_KEYS.has(key) && isNumber(value))) {
        return CARTESIAN_AXIS_TYPE.ORDINAL_TIME;
    }
}

function getSeriesOptionsKey<SeriesOptions extends AgCartesianSeriesOptions>(
    direction: ChartAxisDirection,
    seriesOptions: SeriesOptions
): string | undefined {
    if (direction === ChartAxisDirection.X && 'xKey' in seriesOptions) {
        return seriesOptions.xKey;
    } else if (direction === ChartAxisDirection.Y && 'yKey' in seriesOptions) {
        return seriesOptions.yKey;
    }
}

function getAxisPosition<SeriesOptions extends AgCartesianSeriesOptions>(
    direction: ChartAxisDirection,
    seriesOptions: SeriesOptions
) {
    if ('direction' in seriesOptions && seriesOptions.direction === 'horizontal') {
        return direction === ChartAxisDirection.X ? CARTESIAN_POSITION.LEFT : CARTESIAN_POSITION.BOTTOM;
    }
    return direction === ChartAxisDirection.X ? CARTESIAN_POSITION.BOTTOM : CARTESIAN_POSITION.LEFT;
}
