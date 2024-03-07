import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import type { TimeScale } from '../../scale/timeScale';
import { Default } from '../../util/default';
import { TimeInterval } from '../../util/time/interval';
import { isFiniteNumber } from '../../util/type-guards';
import {
    ARRAY,
    BOOLEAN,
    COLOR_STRING,
    MIN_SPACING,
    POSITIVE_NUMBER,
    Validate,
    predicateWithMessage,
} from '../../util/validation';

export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale ? number | TimeInterval : number;

export type TickCount<S> = S extends TimeScale ? number | TimeInterval : number;

const TICK_INTERVAL = predicateWithMessage(
    (value) => (isFiniteNumber(value) && value > 0) || value instanceof TimeInterval,
    `a non-zero positive Number value or, for a time axis, a Time Interval such as 'agCharts.time.month'`
);

export class AxisTick<S extends Scale<D, number, I>, D = any, I = any> {
    @Validate(BOOLEAN)
    enabled = true;

    /**
     * The line width to be used by axis ticks.
     */
    @Validate(POSITIVE_NUMBER)
    width: number = 1;

    /**
     * The line length to be used by axis ticks.
     */
    @Validate(POSITIVE_NUMBER)
    size: number = 6;

    /**
     * The color of the axis ticks.
     * Use `undefined` rather than `rgba(0, 0, 0, 0)` to make the ticks invisible.
     */
    @Validate(COLOR_STRING, { optional: true })
    color?: string = undefined;

    @Validate(TICK_INTERVAL, { optional: true })
    interval?: TickInterval<S> = undefined;

    @Validate(ARRAY, { optional: true })
    values?: any[] = undefined;

    @Validate(MIN_SPACING)
    @Default(NaN)
    minSpacing: number = NaN;

    // Maybe initialised and validated in subclasses - DO NOT ASSIGN A VALUE HERE.
    maxSpacing?: number;
}
