import { _ModuleSupport } from 'ag-charts-community';
import { type ScaleTickParams, isDenseInterval, isNumberEqual, range } from 'ag-charts-core';

const { LinearScale } = _ModuleSupport;

export class LinearAngleScale extends LinearScale {
    static getNiceStepAndTickCount(ticks: ScaleTickParams<number>, domain: (number | bigint)[]) {
        const [start, stop] = domain.map(Number);
        let step = LinearScale.getTickStep(start, stop, ticks);
        const maxTickCount = Number.isNaN(ticks.maxTickCount) ? Infinity : ticks.maxTickCount;
        const expectedTickCount = Math.abs(stop - start) / step;
        let niceTickCount = Math.pow(2, Math.ceil(Math.log(expectedTickCount) / Math.log(2)));
        if (niceTickCount > maxTickCount) {
            niceTickCount /= 2;
            step *= 2;
        }
        return { count: niceTickCount, step };
    }

    arcLength: number = 0;

    override ticks(
        ticks: ScaleTickParams<number>,
        domain: (number | bigint)[] = this.domain
    ): { ticks: number[]; count: number } {
        const { arcLength } = this;

        // Angle scales nice-step in Number space (log2/pow); a bigint domain narrows here — a documented
        // limitation in the same class as custom intervals (AC #17). Value positioning stays full-precision
        // via convert()'s bigint path; only these tick *label* values are Number-precision.
        const numericDomain = domain.map(Number);
        if (numericDomain.length < 2 || numericDomain.some((d) => !Number.isFinite(d)) || arcLength <= 0) {
            return { ticks: [], count: 0 };
        }

        const { nice, interval } = ticks;
        const [d0, d1] = numericDomain;

        if (interval) {
            // A custom interval step is a Number concept (AG-16608 AC #17); narrow a bigint step.
            const step = Math.abs(Number(interval));
            const availableRange = this.getPixelRange();
            if (!isDenseInterval((d1 - d0) / step, availableRange)) {
                const result = range(d0, d1, step);
                return { ticks: result.ticks, count: result.count };
            }
        }

        let step: number;
        if (nice && this.hasNiceRange()) {
            const linearNiceDomain = super.niceDomain(ticks, domain);
            step = LinearAngleScale.getNiceStepAndTickCount(ticks, linearNiceDomain).step;
        } else {
            step = LinearScale.getTickStep(d0, d1, ticks);
        }

        const result = range(d0, d1, step);
        return { ticks: result.ticks, count: result.count };
    }

    private hasNiceRange() {
        const sortedRange = this.range.slice().sort((a, b) => a - b);
        const niceRanges = [Math.PI, 2 * Math.PI];
        return niceRanges.some((r) => isNumberEqual(r, sortedRange[1] - sortedRange[0]));
    }

    override niceDomain(
        ticks: ScaleTickParams<number>,
        domain: (number | bigint)[] = this.domain
    ): (number | bigint)[] {
        const linearNiceDomain = super.niceDomain(ticks, domain);

        if (!this.hasNiceRange()) return linearNiceDomain;

        // Extend the nice domain in Number space (see ticks() — bigint narrows here, AC #17).
        const [n0, n1] = linearNiceDomain.map(Number);
        const reversed = n0 > n1;
        const start = reversed ? n1 : n0;
        const { step, count } = LinearAngleScale.getNiceStepAndTickCount(ticks, linearNiceDomain);
        const s = 1 / step; // Prevent floating point error
        const stop = step >= 1 ? Math.ceil(start / step + count) * step : Math.ceil((start + count * step) * s) / s;

        return reversed ? [stop, start] : [start, stop];
    }

    protected override getPixelRange() {
        return this.arcLength;
    }
}
