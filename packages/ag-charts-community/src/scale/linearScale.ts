import { formatValue } from '../util/format.util';
import { createTicks, isDenseInterval, niceTicksDomain, range, tickFormat, tickStep } from '../util/ticks';
import { ContinuousScale } from './continuousScale';
import type { ScaleFormatParams, ScaleTickParams } from './scale';
import { filterVisibleTicks } from './scaleUtil';

/**
 * Maps continuous domain to a continuous range.
 */
export class LinearScale extends ContinuousScale<number> {
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
    ): number[] {
        if (!domain || domain.length < 2 || tickCount < 1 || !domain.every(isFinite)) {
            return [];
        }
        const [d0, d1] = domain;

        if (interval) {
            const step = Math.abs(interval);
            if (!isDenseInterval((d1 - d0) / step, this.getPixelRange())) {
                return range(d0, d1, step);
            }
        }

        let ticks = createTicks(d0, d1, tickCount, minTickCount, maxTickCount);
        ticks = filterVisibleTicks(ticks, d0 > d1, visibleRange);

        return ticks;
    }

    override niceDomain(ticks: ScaleTickParams<number>, domain: number[] = this.domain) {
        if (domain.length < 2) return [];

        const { tickCount = ContinuousScale.defaultTickCount } = ticks;
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

        return [start, stop];
    }

    override tickFormatter({ ticks: specifiedTicks, fractionDigits, specifier }: ScaleFormatParams<number>) {
        return specifier != null
            ? tickFormat(specifiedTicks, specifier)
            : (x: number) => formatValue(x, fractionDigits);
    }

    override datumFormatter({ ticks: specifiedTicks, fractionDigits, specifier }: ScaleFormatParams<number>) {
        return specifier != null
            ? tickFormat(specifiedTicks, specifier)
            : (x: number) => formatValue(x, fractionDigits + 1);
    }
}
