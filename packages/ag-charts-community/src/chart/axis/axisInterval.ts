import { Default } from '../../util/default';
import { BaseProperties } from '../../util/properties';
import { TimeInterval } from '../../util/time';
import { isFiniteNumber } from '../../util/type-guards';
import { ARRAY, MAX_SPACING, MIN_SPACING, Validate, predicateWithMessage } from '../../util/validation';
import type { TickInterval } from './axisTick';

export const TICK_INTERVAL = predicateWithMessage(
    (value) => (isFiniteNumber(value) && value > 0) || value instanceof TimeInterval,
    `a non-zero positive Number value or, for a time axis, a Time Interval such as 'agCharts.time.month'`
);

export class AxisInterval<S> extends BaseProperties {
    @Validate(TICK_INTERVAL, { optional: true })
    step?: TickInterval<S>;

    @Validate(ARRAY, { optional: true })
    values?: any[];

    @Validate(MIN_SPACING)
    @Default(NaN)
    minSpacing: number = NaN;

    @Validate(MAX_SPACING)
    @Default(NaN)
    maxSpacing: number = NaN;
}
