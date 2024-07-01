import { TimeInterval } from '../util/time/interval';
import { ContinuousScale } from './continuousScale';
import type { ScaleConvertParams } from './scale';
export declare class TimeScale extends ContinuousScale<Date, TimeInterval | number> {
    readonly type = "time";
    constructor();
    toDomain(d: number): Date;
    convert(x: Date, opts?: ScaleConvertParams | undefined): number;
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
    tickFormat({ ticks, domain, specifier, formatOffset, }: {
        ticks?: any[];
        domain?: any[];
        specifier?: string;
        formatOffset?: number;
    }): (date: Date) => string;
    update(): void;
    /**
     * Extends the domain so that it starts and ends on nice round values.
     * This method typically modifies the scale’s domain, and may only extend the bounds to the nearest round value.
     */
    protected updateNiceDomain(): void;
    protected updateNiceDomainIteration(d0: Date, d1: Date): void;
}
