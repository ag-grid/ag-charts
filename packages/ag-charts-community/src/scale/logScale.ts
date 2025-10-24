import type { ScaleTickParams } from 'ag-charts-core';
import { isInteger } from 'ag-charts-core';

import { findMinMax, findRangeExtent } from 'ag-charts-core/utils/numberArray';
import { createTicks, isDenseInterval, range } from '../util/ticks';
import { ContinuousScale } from './continuousScale';
import { filterVisibleTicks } from './scaleUtil';

const logFunctions: Record<number, (base: number, x: number) => number> = {
    2: (_base, x) => Math.log2(x),
    [Math.E]: (_base, x) => Math.log(x),
    10: (_base, x) => Math.log10(x),
};

const DEFAULT_LOG = (base: number, x: number) => Math.log(x) / Math.log(base);

function log(base: number, domain: number[], x: number) {
    const start = Math.min(...domain);
    const fn = logFunctions[base] ?? DEFAULT_LOG;
    return start >= 0 ? fn(base, x) : -fn(base, -x);
}

const powFunctions: Record<number, (base: number, x: number) => number> = {
    [Math.E]: (_base, x) => Math.exp(x),
    10: (_base, x) => (x >= 0 ? 10 ** x : 1 / 10 ** -x),
};

const DEFAULT_POW = (base: number, x: number) => base ** x;

function pow(base: number, domain: number[], x: number) {
    const start = Math.min(...domain);
    const fn = powFunctions[base] ?? DEFAULT_POW;
    return start >= 0 ? fn(base, x) : -fn(base, -x);
}

export class LogScale extends ContinuousScale<number> {
    static override is(value: unknown): value is LogScale {
        return value instanceof LogScale;
    }

    readonly type = 'log';

    // Handling <1 and crossing 0 cases is tricky, easiest solution is to default to clamping.
    protected override defaultClamp: boolean = true;

    public constructor(d: number[] = [1, 10], r: number[] = [0, 1]) {
        super(d, r);
    }

    override transform(this: LogScale, x: number) {
        const [min, max] = findMinMax(this.domain);
        if (min >= 0 !== max >= 0) return Number.NaN;
        return min >= 0 ? Math.log(x) : -Math.log(-x);
    }

    override transformInvert(this: LogScale, x: number) {
        const [min, max] = findMinMax(this.domain);
        if (min >= 0 !== max >= 0) return Number.NaN;
        return min >= 0 ? Math.exp(x) : -Math.exp(-x);
    }

    toDomain(d: number): number {
        return d;
    }

    base = 10;

    private readonly log = (x: number) => log(this.base, this.domain, x);
    private readonly pow = (x: number) => pow(this.base, this.domain, x);

    override niceDomain(_ticks: ScaleTickParams<number>, domain: number[] = this.domain): number[] {
        if (domain.length < 2) return [];

        const { base } = this;
        const [d0, d1] = domain;

        const roundStart = d0 > d1 ? Math.ceil : Math.floor;
        const roundStop = d0 > d1 ? Math.floor : Math.ceil;

        const n0 = pow(base, domain, roundStart(log(base, domain, d0)));
        const n1 = pow(base, domain, roundStop(log(base, domain, d1)));

        return [n0, n1];
    }

    override ticks(
        { interval, tickCount = ContinuousScale.defaultTickCount }: ScaleTickParams<number>,
        domain: number[] = this.domain,
        visibleRange?: [number, number]
    ): { ticks: number[]; count: number; firstTickIndex: number | undefined } | undefined {
        if (!domain || domain.length < 2 || tickCount < 1) {
            return;
        }
        const base = this.base;
        const [d0, d1] = domain;

        const start = Math.min(d0, d1);
        const stop = Math.max(d0, d1);

        let p0 = this.log(start);
        let p1 = this.log(stop);

        if (interval) {
            const inBounds = (tick: number) => tick >= start && tick <= stop;
            const step = Math.min(Math.abs(interval), Math.abs(p1 - p0));
            const { ticks: rangeTicks, count, firstTickIndex } = range(p0, p1, step, visibleRange);
            const ticks = rangeTicks.map(this.pow).filter(inBounds);

            if (!isDenseInterval(ticks.length, this.getPixelRange())) {
                return { ticks, count, firstTickIndex };
            }
        }

        // If base is a float or the difference between p1 and p0 is large,
        // returns ticks in the format [10^1, 10^2, 10^3, 10^4, ...].
        if (!isInteger(base) || p1 - p0 >= tickCount) {
            const step = Math.min(p1 - p0, tickCount);
            const { ticks, count, firstTickIndex } = createTicks(p0, p1, step, undefined, undefined, visibleRange);
            return {
                ticks: ticks.map(this.pow),
                count,
                firstTickIndex,
            };
        }

        const ticks: number[] = [];
        const isPositive = start > 0;
        p0 = Math.floor(p0) - 1;
        p1 = Math.round(p1) + 1;

        const availableSpacing = findRangeExtent(this.range) / tickCount;
        let lastTickPosition = Infinity;
        for (let p = p0; p <= p1; p++) {
            const nextMagnitudeTickPosition = this.convert(this.pow(p + 1));
            for (let k = 1; k < base; k++) {
                const q = isPositive ? k : base - k + 1;
                const t = this.pow(p) * q;
                const tickPosition = this.convert(t);
                const prevSpacing = Math.abs(lastTickPosition - tickPosition);
                const nextSpacing = Math.abs(tickPosition - nextMagnitudeTickPosition);
                const fits = prevSpacing >= availableSpacing && nextSpacing >= availableSpacing;
                if (t >= start && t <= stop && (k === 1 || fits || ticks.length === 0)) {
                    ticks.push(t);
                    lastTickPosition = tickPosition;
                }
            }
        }

        return filterVisibleTicks(ticks, isPositive, visibleRange);
    }
}
