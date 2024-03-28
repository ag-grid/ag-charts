import type { TimeInterval } from '../util/time/interval';
import { BandScale } from './bandScale';
export declare class OrdinalTimeScale extends BandScale<Date, TimeInterval | number> {
    readonly type = "ordinal-time";
    static is(value: any): value is OrdinalTimeScale;
    tickCount: number;
    minTickCount: number;
    maxTickCount: number;
    interval?: TimeInterval | number;
    toDomain(d: number): Date;
    protected index: Map<Date[], number>;
    /**
     * Contains unique datums only. Since `{}` is used in place of `Map`
     * for IE11 compatibility, the datums are converted `toString` before
     * the uniqueness check.
     */
    protected _domain: Date[];
    set domain(values: Date[]);
    get domain(): Date[];
    ticks(): Date[];
    convert(d: Date): number;
    /**
     * Returns a time format function suitable for displaying tick values.
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
     */
    tickFormat({ ticks, specifier }: {
        ticks?: any[];
        specifier?: string;
    }): (date: Date) => string;
    invert(y: number): Date;
}
