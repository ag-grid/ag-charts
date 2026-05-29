import type { ScaleTickParams } from 'ag-charts-core';
import {
    createBigIntTicks,
    createTicks,
    isDenseInterval,
    niceBigIntDomain,
    niceTicksDomain,
    range,
    tickStep,
} from 'ag-charts-core';

import { ContinuousScale } from './continuousScale';

/**
 * Maps continuous domain to a continuous range.
 */
export class LinearScale extends ContinuousScale<number> {
    static override is(value: unknown): value is LinearScale {
        return value instanceof LinearScale;
    }

    protected static getTickStep(start: number, stop: number, ticks: ScaleTickParams<number>) {
        const { interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount } = ticks;
        return interval ?? tickStep(start, stop, tickCount, minTickCount, maxTickCount);
    }

    readonly type = 'number';

    public constructor() {
        super([0, 1], [0, 1]);
    }

    toDomain(d: number): number {
        return d;
    }

    override ticks(
        { interval, tickCount = ContinuousScale.defaultTickCount, minTickCount, maxTickCount }: ScaleTickParams<number>,
        domain: number[] = this.domain,
        visibleRange?: [number, number]
    ): { ticks: number[]; count: number; firstTickIndex?: number } {
        if (!domain || domain.length < 2 || tickCount < 1) {
            return { ticks: [], count: 0, firstTickIndex: 0 };
        }
        const [b0, b1] = domain as readonly (number | bigint)[];
        const isBigIntDomain = typeof b0 === 'bigint' && typeof b1 === 'bigint';

        // Full-precision BigInt ticks for the full (unzoomed) domain: the convert() bigint path
        // positions them and the formatter renders exact labels. A custom interval or a zoomed
        // sub-range falls through to the Number path, narrowing the domain below — the zoomed
        // sub-domain renders at Number precision (documented limitation, AG-16608 AC #17).
        const fullRange = visibleRange == null || (visibleRange[0] === 0 && visibleRange[1] === 1);
        if (isBigIntDomain && !interval && fullRange) {
            const ticks = createBigIntTicks(b0, b1, tickCount) as unknown as number[];
            return { ticks, count: ticks.length, firstTickIndex: 0 };
        }

        const numericDomain = isBigIntDomain ? domain.map(Number) : domain;
        if (!numericDomain.every(Number.isFinite)) {
            return { ticks: [], count: 0, firstTickIndex: 0 };
        }

        const [d0, d1] = numericDomain;

        if (interval) {
            const step = Math.abs(interval);
            if (!isDenseInterval((d1 - d0) / step, this.getPixelRange())) {
                return range(d0, d1, step, visibleRange);
            }
        }

        return createTicks(d0, d1, tickCount, minTickCount, maxTickCount, visibleRange);
    }

    override niceDomain(ticks: ScaleTickParams<number>, domain: number[] = this.domain) {
        if (domain.length < 2) return [];

        const { tickCount = ContinuousScale.defaultTickCount } = ticks;

        const [b0, b1] = domain as readonly (number | bigint)[];
        if (typeof b0 === 'bigint' && typeof b1 === 'bigint') {
            const [n0, n1] = niceBigIntDomain(b0, b1, tickCount);
            return [ticks.nice[0] ? n0 : b0, ticks.nice[1] ? n1 : b1] as unknown as number[];
        }

        let [start, stop] = domain;

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
                const [d0, d1] = domain;

                start = roundStart(d0 / step) * step;
                stop = roundStop(d1 / step) * step;

                if (start === prev0 && stop === prev1) break;
            }
        }

        return [ticks.nice[0] ? start : domain[0], ticks.nice[1] ? stop : domain[1]];
    }
}
