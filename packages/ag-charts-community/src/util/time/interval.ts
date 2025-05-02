import { Logger } from 'ag-charts-core';
import type { TimeIntervalUnit } from 'ag-charts-types';

/**
 * Converts the specified Date into a count of years,
 * days, hours etc. passed since some base date.
 */
type EncodeFn = (date: Date) => number;
/**
 * Converts the count of years, days, hours etc.
 * since a base date into another Date.
 */
type DecodeFn = (encoded: number) => Date;
/**
 * A function to be executed before the range calculation.
 * Returns a callback to be executed after the range calculation.
 */
type RangeFn = (start: Date, end: Date) => () => void;

interface RangeParams {
    extend?: boolean;
    visibleRange?: [number, number];
    limit?: number;
}

interface EveryParams {
    snapTo?: Date | number | 'start' | 'end';
}

/**
 * The interval methods don't mutate Date parameters.
 */
export class TimeInterval {
    constructor(
        public readonly unit: TimeIntervalUnit,
        public readonly milliseconds: number,
        public readonly hierarchy: TimeInterval | undefined,
        protected readonly _encode: EncodeFn,
        protected readonly _decode: DecodeFn,
        public readonly step = 1,
        protected readonly _rangeCallback?: RangeFn
    ) {}

    static extent(start: Date, stop: Date, visibleRange?: [number, number]) {
        if (start.getTime() > stop.getTime()) {
            [start, stop] = [stop, start];

            if (visibleRange != null) {
                visibleRange = [1 - visibleRange[1], 1 - visibleRange[0]];
            }
        }

        if (visibleRange != null) {
            const delta = stop.getTime() - start.getTime();
            const t0 = start.getTime();

            start = new Date(t0 + visibleRange[0] * delta);
            stop = new Date(t0 + visibleRange[1] * delta);
        }

        return [start, stop];
    }

    private getOffset(snapTo: Date, step: number) {
        return Math.floor(this._encode(new Date(snapTo))) % step;
    }

    /**
     * Returns a new date representing the latest interval boundary date before or equal to date.
     * For example, `day.floor(date)` typically returns 12:00 AM local time on the given date.
     * @param date
     */
    floor(date: Date | number): Date {
        const d = new Date(date);
        const e = this._encode(d);
        return this._decode(e);
    }

    /**
     * Returns a new date representing the earliest interval boundary date after or equal to date.
     * @param date
     */
    ceil(date: Date | number): Date {
        const d = new Date(Number(date) - 1);
        const e = this._encode(d);
        return this._decode(e + 1);
    }

    private rangeIndices(
        start: Date,
        stop: Date,
        { extend = false, visibleRange = [0, 1], limit }: RangeParams
    ): [number, number] {
        [start, stop] = TimeInterval.extent(start, stop, visibleRange);

        const e0 = this._encode(extend ? this.floor(start) : this.ceil(start));
        let e1 = this._encode(extend ? this.ceil(stop) : this.floor(stop));

        if (limit != null && e1 - e0 > limit) {
            e1 = e0 + limit;
        }

        return [e0, e1];
    }

    /**
     * Returns an array of dates representing every interval boundary after or equal to start (inclusive) and before stop (exclusive).
     * @param start Range start.
     * @param stop Range end.
     * @param extend If specified, the requested range will be extended to the closest "nice" values.
     */
    range(start: Date, stop: Date, params: RangeParams = {}): Date[] {
        let rangeCallback: (() => void) | undefined;
        if (start.getTime() > stop.getTime()) {
            rangeCallback = this._rangeCallback?.(stop, start);
        } else {
            rangeCallback = this._rangeCallback?.(start, stop);
        }

        const [e0, e1] = this.rangeIndices(start, stop, params);

        const range: Date[] = [];
        for (let e = e0; e <= e1; e++) {
            const d = this._decode(e);
            range.push(d);
        }

        rangeCallback?.();

        return range;
    }

    previous(date: Date) {
        return this._decode(this._encode(this.ceil(date)) - 1);
    }

    next(date: Date) {
        return this._decode(this._encode(this.floor(date)) + 1);
    }

    rangeCount(start: Date, stop: Date, params: RangeParams = {}) {
        const [e0, e1] = this.rangeIndices(start, stop, params);
        return e1 - e0;
    }

    /**
     * Returns a filtered view of this interval representing every step'th date.
     * It can be a number of minutes, hours, days etc.
     * Must be a positive integer.
     * @param step
     */
    every(step: number, options?: EveryParams): TimeInterval {
        if (step === 1 && options?.snapTo != null) return this;

        const { unit, milliseconds, hierarchy, step: baseStep } = this;

        let offset = 0;
        let rangeCallback: RangeFn | undefined;

        const unsafeStep = step;
        step = Math.max(1, Math.round(step));
        if (unsafeStep !== step) {
            Logger.warnOnce(`interval step of [${unsafeStep}] rounded to [${step}].`);
        }

        const { snapTo = 'start' } = options ?? {};
        if (typeof snapTo === 'string') {
            const initialOffset = offset;
            rangeCallback = (start, stop) => {
                const s = snapTo === 'start' ? start : stop;
                offset = this.getOffset(s, step);
                return () => (offset = initialOffset);
            };
        } else if (typeof snapTo === 'number') {
            offset = this.getOffset(new Date(snapTo), step);
        } else if (snapTo instanceof Date) {
            offset = this.getOffset(snapTo, step);
        }

        const encode = (date: Date) => Math.floor((this._encode(date) - offset) / step);
        const decode = (encoded: number) => this._decode(encoded * step + offset);

        return new TimeInterval(unit, milliseconds * step, hierarchy, encode, decode, baseStep * step, rangeCallback);
    }
}
