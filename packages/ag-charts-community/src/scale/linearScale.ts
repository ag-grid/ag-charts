import { createTicks, isDenseInterval, niceTicksDomain, range, tickFormat, tickStep } from '../util/ticks';
import { ContinuousScale } from './continuousScale';
import type { ScaleDomainTicks } from './scale';

/**
 * Maps continuous domain to a continuous range.
 */
export class LinearScale extends ContinuousScale<number> {
    protected static getTickStep(start: number, stop: number, ticks: ScaleDomainTicks<number>) {
        const { interval, tickCount, minTickCount, maxTickCount } = ticks;
        return interval ?? tickStep(start, stop, tickCount, minTickCount, maxTickCount);
    }

    readonly type = 'number';

    public constructor() {
        super([0, 1], [0, 1]);
    }

    toDomain(d: number): number {
        return d;
    }

    ticks(): number[] {
        const count = this.tickCount ?? ContinuousScale.defaultTickCount;
        if (!this.domain || this.domain.length < 2 || count < 1 || !this.domain.every(isFinite)) {
            return [];
        }
        this.refresh();
        const [d0, d1] = this.getDomain();

        if (this.interval) {
            const step = Math.abs(this.interval);
            if (!isDenseInterval((d1 - d0) / step, this.getPixelRange())) {
                return range(d0, d1, step);
            }
        }

        return createTicks(d0, d1, count, this.minTickCount, this.maxTickCount);
    }

    update() {
        if (!this.domain || this.domain.length < 2) {
            return;
        }
        if (this.nice) {
            this.updateNiceDomain();
        }
    }

    /**
     * Extends the domain so that it starts and ends on nice round values.
     */
    protected updateNiceDomain() {
        this._niceDomain = this.niceDomain(this.domain, {
            interval: this.interval,
            tickCount: this.tickCount,
            minTickCount: this.minTickCount,
            maxTickCount: this.maxTickCount,
        });
    }

    niceDomain(domain: number[], ticks: ScaleDomainTicks<number>) {
        const { tickCount } = ticks;
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

    tickFormat({ ticks: specifiedTicks, specifier }: { ticks?: any[]; specifier?: string }) {
        return tickFormat(specifiedTicks ?? this.ticks(), specifier);
    }
}
