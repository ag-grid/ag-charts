import { tickFormat } from '../util/numberFormat';
import { createTicks, isDenseInterval, niceTicksDomain, range, tickStep } from '../util/ticks';
import { ContinuousScale } from './continuousScale';

/**
 * Maps continuous domain to a continuous range.
 */
export class LinearScale extends ContinuousScale<number> {
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

    protected getTickStep(start: number, stop: number) {
        return this.interval ?? tickStep(start, stop, this.tickCount, this.minTickCount, this.maxTickCount);
    }

    /**
     * Extends the domain so that it starts and ends on nice round values.
     */
    protected updateNiceDomain() {
        const count = this.tickCount;
        if (count < 1) {
            this.niceDomain = [...this.domain];
            return;
        }

        let [start, stop] = this.domain;

        if (count === 1) {
            [start, stop] = niceTicksDomain(start, stop);
        } else {
            const roundStart = start > stop ? Math.ceil : Math.floor;
            const roundStop = stop < start ? Math.floor : Math.ceil;
            const maxAttempts = 4;
            for (let i = 0; i < maxAttempts; i++) {
                const prev0 = start;
                const prev1 = stop;
                const step = this.getTickStep(start, stop);
                const [d0, d1] = this.domain;
                if (step >= 1) {
                    start = roundStart(d0 / step) * step;
                    stop = roundStop(d1 / step) * step;
                } else {
                    // Prevent floating point error
                    const s = 1 / step;
                    start = roundStart(d0 * s) / s;
                    stop = roundStop(d1 * s) / s;
                }
                if (start === prev0 && stop === prev1) {
                    break;
                }
            }
        }

        this.niceDomain = [start, stop];
    }

    tickFormat({ ticks: specifiedTicks, specifier }: { ticks?: any[]; specifier?: string }) {
        return tickFormat(specifiedTicks ?? this.ticks(), specifier);
    }
}
