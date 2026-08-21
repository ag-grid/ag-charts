import type { ScaleTickParams } from 'ag-charts-core';
import {
    createBigIntTicks,
    createTicks,
    isBigInt,
    isDenseInterval,
    niceBigIntDomain,
    niceTicksDomain,
    range,
    tickStep,
} from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { ContinuousScale } from './continuousScale';

/**
 * Maps continuous domain to a continuous range.
 */
export class LinearScale extends ContinuousScale<AgNumericValue> {
    static override is(value: unknown): value is LinearScale {
        return value instanceof LinearScale;
    }

    protected static getTickStep(start: number, stop: number, ticks: ScaleTickParams<number>) {
        const { interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount } = ticks;
        return interval == null ? tickStep(start, stop, tickCount, minTickCount, maxTickCount) : Number(interval);
    }

    readonly type = 'number';

    public constructor() {
        super([0, 1], [0, 1]);
    }

    toDomain(d: number): AgNumericValue {
        if (isBigInt(this.domainMin) && isBigInt(this.domainMax) && (isBigInt(d) || Number.isInteger(d))) {
            return BigInt(d);
        }

        return d;
    }

    override ticks(
        { interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount }: ScaleTickParams<number>,
        domain: AgNumericValue[] = this.domain,
        visibleRange?: [number, number]
    ): { ticks: AgNumericValue[]; count: number; firstTickIndex?: number } {
        if (!domain || domain.length < 2 || tickCount < 1) {
            return { ticks: [], count: 0, firstTickIndex: 0 };
        }
        const [b0, b1] = domain;
        const isBigIntDomain = typeof b0 === 'bigint' && typeof b1 === 'bigint';

        // Full-precision BigInt ticks for the full (unzoomed) domain only; a custom interval or zoomed
        // sub-range falls through to the Number path below.
        const fullRange = visibleRange == null || (visibleRange[0] === 0 && visibleRange[1] === 1);
        if (isBigIntDomain && !interval && fullRange) {
            const ticks = createBigIntTicks(b0, b1, tickCount);
            return { ticks, count: ticks.length, firstTickIndex: 0 };
        }

        const numericDomain: number[] = domain.map(Number);
        if (!numericDomain.every(Number.isFinite)) {
            return { ticks: [], count: 0, firstTickIndex: 0 };
        }

        const [d0, d1] = numericDomain;

        if (interval) {
            // A custom interval step is a Number concept; bigint full precision applies only to the auto-step path.
            const step = Math.abs(Number(interval));
            if (!isDenseInterval((d1 - d0) / step, this.getPixelRange(), this.logger)) {
                return range(d0, d1, step, visibleRange);
            }
        }

        return createTicks(d0, d1, tickCount, minTickCount, maxTickCount, visibleRange);
    }

    override niceDomain(ticks: ScaleTickParams<number>, domain: AgNumericValue[] = this.domain): AgNumericValue[] {
        if (domain.length < 2) return [];

        const { tickCount = ContinuousScale.defaultTickCount } = ticks;

        const [b0, b1] = domain;
        const isBigIntDomain = typeof b0 === 'bigint' && typeof b1 === 'bigint';

        // Bigint nicing only for the auto-step path; a custom interval is a Number concept (matches
        // ticks()), so it falls through below — else bounds would snap to an unrelated auto step.
        if (isBigIntDomain && ticks.interval == null) {
            const [n0, n1] = niceBigIntDomain(b0, b1, tickCount);
            return [ticks.nice[0] ? n0 : b0, ticks.nice[1] ? n1 : b1];
        }

        const numericDomain: number[] = domain.map(Number);
        let [start, stop] = numericDomain;

        if (tickCount === 1) {
            [start, stop] = niceTicksDomain(start, stop);
        } else if (tickCount > 1) {
            const roundStart = start > stop ? Math.ceil : Math.floor;
            const roundStop = start > stop ? Math.floor : Math.ceil;
            const maxAttempts = 4;

            for (let i = 0; i < maxAttempts; i++) {
                const prev0 = start;
                const prev1 = stop;
                const step = LinearScale.getTickStep(start, stop, ticks);
                const [d0, d1] = numericDomain;

                start = roundStart(d0 / step) * step;
                stop = roundStop(d1 / step) * step;

                if (start === prev0 && stop === prev1) break;
            }
        }

        return [ticks.nice[0] ? start : numericDomain[0], ticks.nice[1] ? stop : numericDomain[1]];
    }
}
