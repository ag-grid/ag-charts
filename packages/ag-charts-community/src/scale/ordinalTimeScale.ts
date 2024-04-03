import type { TimeInterval } from '../util/time/interval';
import { buildFormatter } from '../util/timeFormat';
import { dateToNumber, defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import { ContinuousScale } from './continuousScale';
import { Invalidating } from './invalidating';
import { TimeScale } from './timeScale';

export class OrdinalTimeScale extends BandScale<Date, TimeInterval | number> {
    override readonly type = 'ordinal-time';

    static override is(value: any): value is OrdinalTimeScale {
        return value instanceof OrdinalTimeScale;
    }

    @Invalidating
    tickCount = ContinuousScale.defaultTickCount;
    @Invalidating
    minTickCount = 0;
    @Invalidating
    maxTickCount = Infinity;

    @Invalidating
    override interval?: TimeInterval | number = undefined;

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

    override ticks(): Date[] {
        this.refresh();

        const [t0, t1] = [dateToNumber(this.domain[0]), dateToNumber(this.domain.at(-1))];

        const start = Math.min(t0, t1);
        const stop = Math.max(t0, t1);

        const { interval, tickCount, minTickCount, maxTickCount } = this;

        let ticks;
        if (interval !== undefined) {
            const [r0, r1] = this.range;
            const availableRange = Math.abs(r1 - r0);
            ticks = TimeScale.getTicksForInterval({ start, stop, interval, availableRange });
        }

        ticks ??= TimeScale.getDefaultTicks({ start, stop, tickCount, minTickCount, maxTickCount });

        // max one tick per band
        const tickPositions = new Set<number>();
        ticks = ticks.filter((tick) => {
            const position = this.convert(tick);
            if (tickPositions.has(position)) {
                return false;
            }
            tickPositions.add(position);
            return true;
        });

        return ticks;
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
        return specifier == null ? defaultTimeTickFormat(ticks) : buildFormatter(specifier);
    }

    override invert(y: number): Date {
        return new Date(super.invert(y));
    }

    override invertNearest(y: number): Date {
        return new Date(super.invertNearest(y));
    }
}
