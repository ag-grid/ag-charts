import type { CountableTimeInterval } from '../util/time/interval';
import { TimeInterval } from '../util/time/interval';
import { ContinuousScale } from './continuousScale';
export declare class TimeScale extends ContinuousScale<Date, TimeInterval | number> {
    readonly type = "time";
    /**
     * Array of default tick intervals in the following format:
     *
     *     [
     *         interval (unit of time),
     *         number of units (step),
     *         the length of that number of units in milliseconds
     *     ]
     */
    static readonly tickIntervals: [CountableTimeInterval, number, number][];
    constructor();
    toDomain(d: number): Date;
    /**
     * @param options Tick interval options.
     * @param options.start The start time (timestamp).
     * @param options.stop The end time (timestamp).
     * @param options.count Number of intervals between ticks.
     */
    static getTickInterval({ start, stop, count, minCount, maxCount, target, }: {
        start: number;
        stop: number;
        count: number;
        minCount: number;
        maxCount: number;
        target?: number;
    }): CountableTimeInterval | TimeInterval | undefined;
    static getIntervalIndex(target: number): number;
    invert(y: number): Date;
    /**
     * Returns uniformly-spaced dates that represent the scale's domain.
     */
    ticks(): Date[];
    static getDefaultTicks({ start, stop, tickCount, minTickCount, maxTickCount, }: {
        start: number;
        stop: number;
        tickCount: number;
        minTickCount: number;
        maxTickCount: number;
    }): Date[];
    static getTicksForInterval({ start, stop, interval, availableRange, }: {
        start: number;
        stop: number;
        interval: number | TimeInterval;
        availableRange: number;
    }): Date[] | undefined;
    /**
     * Returns a time format function suitable for displaying tick values.
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
     */
    tickFormat({ ticks, domain, specifier, }: {
        ticks?: any[];
        domain?: any[];
        specifier?: string;
    }): (date: Date) => string;
    update(): void;
    /**
     * Extends the domain so that it starts and ends on nice round values.
     * This method typically modifies the scale’s domain, and may only extend the bounds to the nearest round value.
     */
    protected updateNiceDomain(): void;
    protected updateNiceDomainIteration(d0: Date, d1: Date): void;
}
