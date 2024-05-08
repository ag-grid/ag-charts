import { tickFormat } from '../util/numberFormat';
import ticks, { isDenseInterval, range, singleTickDomain, tickStep } from '../util/ticks';
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

    ticks(): { ticks: number[]; fractionDigits: number } {
        const count = this.tickCount ?? ContinuousScale.defaultTickCount;
        if (!this.domain || this.domain.length < 2 || count < 1 || this.domain.some((d) => !isFinite(d))) {
            return { ticks: [], fractionDigits: 0 };
        }
        this.refresh();
        const [d0, d1] = this.getDomain();

        const { interval } = this;

        if (interval) {
            const step = Math.abs(interval);
            const availableRange = this.getPixelRange();
            if (!isDenseInterval({ start: d0, stop: d1, interval: step, availableRange })) {
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
            this.niceDomain = [...this.domain];
            return;
        }

        let [start, stop] = this.domain;

        if (count === 1) {
            [start, stop] = singleTickDomain(start, stop);
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
        return tickFormat(specifiedTicks ?? this.ticks().ticks, specifier);
    }
}
