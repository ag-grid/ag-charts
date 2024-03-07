import { buildFormatter } from '../util/timeFormat';
import {
    DefaultTimeFormats,
    TIME_FORMAT_STRINGS,
    dateToNumber,
    defaultTimeTickFormat,
} from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';

export class OrdinalTimeScale extends BandScale<Date> {
    override readonly type = 'ordinal-time';

    static is(value: any): value is OrdinalTimeScale {
        return value instanceof OrdinalTimeScale;
    }

    toDomain(d: number): Date {
        return new Date(d);
    }

    protected override index: Map<Date[], number> = new Map<Date[], number>();

    /**
     * Contains unique datums only. Since `{}` is used in place of `Map`
     * for IE11 compatibility, the datums are converted `toString` before
     * the uniqueness check.
     */
    protected override _domain: Date[] = [];
    override set domain(values: Date[]) {
        this.invalid = true;

        const domain: Date[] = [];

        const n = values.length;
        if (n === 0) {
            this._domain = domain;
            return;
        }

        this.index = new Map<Date[], number>();
        const { index } = this;

        const isReversed = values[0] > values[n - 1];

        values.forEach((value, i) => {
            const nextValue = this.toDomain(
                dateToNumber(values[i + 1]) + (isReversed ? 1 : -1) || dateToNumber(value) + (isReversed ? -1 : 1)
            );

            const dateRange = isReversed ? [nextValue, value] : [value, nextValue];

            if (index.get(dateRange) === undefined) {
                index.set(dateRange, domain.push(value) - 1);
            }
        });

        this._domain = domain;
    }
    override get domain(): Date[] {
        return this._domain;
    }

    override convert(d: Date): number {
        if (typeof d === 'number') {
            d = new Date(d);
        }

        if (!(d instanceof Date)) {
            return NaN;
        }

        this.refresh();

        let i;

        for (const [dateRange, index] of this.index.entries()) {
            if (d >= dateRange[0] && d <= dateRange[1]) {
                i = index;
                break;
            }
        }

        if (i === undefined) {
            return NaN;
        }

        const r = this.ordinalRange[i];
        if (r === undefined) {
            return NaN;
        }

        return r;
    }

    /**
     * Returns a time format function suitable for displaying tick values.
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
     */
    tickFormat({ ticks, specifier }: { ticks?: any[]; specifier?: string }): (date: Date) => string {
        return specifier == undefined ? defaultTimeTickFormat(ticks) : buildFormatter(specifier);
    }

    override invert(y: number): Date {
        return new Date(super.invert(y));
    }
}
