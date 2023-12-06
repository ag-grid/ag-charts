import { tickFormat } from '../util/numberFormat';
import ticks, { range, singleTickDomain, tickStep } from '../util/ticks';
import { ContinuousScale } from './continuousScale';

/**
 * Maps continuous domain to a continuous range.
 */
export class LinearScale extends ContinuousScale<number> {
    readonly type = 'linear';

    public constructor() {
        super([0, 1], [0, 1]);
    }

    toDomain(d: number): number {
        return d;
    }

    ticks() {
        const count = this.tickCount ?? ContinuousScale.defaultTickCount;
        if (!this.domain || this.domain.length < 2 || count < 1 || this.domain.some((d) => !isFinite(d))) {
            return [];
        }
        this.refresh();
        const [d0, d1] = this.getDomain();

        const { interval } = this;

        if (interval) {
            const step = Math.abs(interval);
            if (!this.isDenseInterval({ start: d0, stop: d1, interval: step })) {
                return range(d0, d1, step);
            }
        }

        return ticks(d0, d1, count, this.minTickCount, this.maxTickCount);
    }

    update() {
        if (!this.domain || this.domain.length < 2) {
            return;
        }
        if (this.nice) {
            this.updateNiceDomain();
        }
    }

    protected getTickStep(start: number, stop: number) {
        const count = this.tickCount ?? ContinuousScale.defaultTickCount;
        return this.interval ?? tickStep(start, stop, count, this.minTickCount, this.maxTickCount);
    }

    /**
     * Extends the domain so that it starts and ends on nice round values.
     */
    protected updateNiceDomain() {
        const count = this.tickCount ?? ContinuousScale.defaultTickCount;
        if (count < 1) {
            this.niceDomain = this.domain;
            return;
        }

        let start = Math.min(this.domain[0], this.domain[1]);
        let stop = Math.max(this.domain[0], this.domain[1]);
        const reversed = this.domain[1] < this.domain[0];

        if (count === 1) {
            [start, stop] = singleTickDomain(start, stop);
        } else {
            const maxAttempts = 4;
            for (let i = 0; i < maxAttempts; i++) {
                const prev0 = start;
                const prev1 = stop;
                const step = this.getTickStep(start, stop);
                const [d0, d1] = this.domain;
                if (step >= 1) {
                    start = Math.floor(d0 / step) * step;
                    stop = Math.ceil(d1 / step) * step;
                } else {
                    // Prevent floating point error
                    const s = 1 / step;
                    start = Math.floor(d0 * s) / s;
                    stop = Math.ceil(d1 * s) / s;
                }
                if (start === prev0 && stop === prev1) {
                    break;
                }
            }
        }

        this.niceDomain = reversed ? [stop, start] : [start, stop];
    }

    tickFormat({ ticks, specifier }: { ticks?: any[]; specifier?: string }) {
        return tickFormat(ticks ?? this.ticks(), specifier);
    }
}
