import type { TimeInterval } from '../util/time';
import { BandScale } from './bandScale';
export declare class OrdinalTimeScale extends BandScale<Date, TimeInterval | number> {
    readonly type = "ordinal-time";
    static is(value: any): value is OrdinalTimeScale;
    tickCount: number;
    minTickCount: number;
    maxTickCount: number;
    interval?: TimeInterval | number;
    protected _domain: Date[];
    protected timestamps: number[];
    protected sortedTimestamps: number[];
    protected visibleRange: [number, number];
    setVisibleRange(visibleRange: [number, number]): void;
    set domain(values: Date[]);
    get domain(): Date[];
    ticks(): Date[];
    private getDefaultTicks;
    convert(d: Date): number;
    private findInterval;
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
    invert(position: number): Date;
    invertNearest(y: number): Date;
}
