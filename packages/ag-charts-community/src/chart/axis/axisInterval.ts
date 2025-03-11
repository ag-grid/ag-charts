import { isFiniteNumber } from 'ag-charts-core';

import { Default } from '../../util/default';
import { BaseProperties } from '../../util/properties';
import { TimeInterval } from '../../util/time';
import { ARRAY, MAX_SPACING, MIN_SPACING, TempValidate, predicateWithMessage } from '../../util/validation';
import type { TickInterval } from './axisTick';

export const TICK_INTERVAL = predicateWithMessage(
    (value) => (isFiniteNumber(value) && value > 0) || value instanceof TimeInterval,
    `a non-zero positive Number value or, for a time axis, a Time Interval such as 'agCharts.time.month'`
);

export class AxisInterval<S> extends BaseProperties {
    @TempValidate(TICK_INTERVAL, { optional: true })
    step?: TickInterval<S>;

    @TempValidate(ARRAY, { optional: true })
    values?: any[];

    @TempValidate(MIN_SPACING)
    @Default(NaN)
    minSpacing: number = NaN;

    @TempValidate(MAX_SPACING)
    @Default(NaN)
    maxSpacing: number = NaN;
}
