import { _ModuleSupport } from 'ag-charts-community';
import { type ScaleTickParams, isDenseInterval, isNumberEqual, range, toNumber } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

const { LinearScale } = _ModuleSupport;

export class LinearAngleScale extends LinearScale {
    static getNiceStepAndTickCount(ticks: ScaleTickParams<number>, domain: AgNumericValue[]) {
        const [start, stop] = domain.map(toNumber);
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
        domain: AgNumericValue[] = this.domain
    ): { ticks: number[]; count: number } {
        const { arcLength } = this;

        // Nice-stepping is Number-only (log2/pow); a bigint domain narrows here for tick labels only.
        const numericDomain = domain.map(toNumber);
        if (numericDomain.length < 2 || numericDomain.some((d) => !Number.isFinite(d)) || arcLength <= 0) {
            return { ticks: [], count: 0 };
        }

        const { nice, interval } = ticks;
        const [d0, d1] = numericDomain;

        if (interval) {
            const step = Math.abs(toNumber(interval));
            const availableRange = this.getPixelRange();
            if (!isDenseInterval((d1 - d0) / step, availableRange, this.logger)) {
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

    override niceDomain(ticks: ScaleTickParams<number>, domain: AgNumericValue[] = this.domain): AgNumericValue[] {
        const linearNiceDomain = super.niceDomain(ticks, domain);

        if (!this.hasNiceRange()) return linearNiceDomain;

        const [n0, n1] = linearNiceDomain.map(toNumber);
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
