import { _ModuleSupport } from 'ag-charts-community';

const { range, isDenseInterval, isNumberEqual, LinearScale, Invalidating } = _ModuleSupport;

export class LinearAngleScale extends LinearScale {
    static getNiceStepAndTickCount(domain: number[], ticks: _ModuleSupport.ScaleDomainTicks<number>) {
        const [start, stop] = domain;
        let step = LinearScale.getTickStep(start, stop, ticks);
        const maxTickCount = isNaN(ticks.maxTickCount) ? Infinity : ticks.maxTickCount;
        const expectedTickCount = Math.abs(stop - start) / step;
        let niceTickCount = Math.pow(2, Math.ceil(Math.log(expectedTickCount) / Math.log(2)));
        if (niceTickCount > maxTickCount) {
            niceTickCount /= 2;
            step *= 2;
        }
        return { count: niceTickCount, step };
    }

    @Invalidating
    arcLength: number = 0;

    override ticks(): number[] {
        if (!this.domain || this.domain.length < 2 || this.domain.some((d) => !isFinite(d)) || this.arcLength <= 0) {
            return [];
        }
        this.refresh();

        const { interval } = this;
        const [d0, d1] = this.getDomain();

        if (interval) {
            const step = Math.abs(interval);
            const availableRange = this.getPixelRange();
            if (!isDenseInterval((d1 - d0) / step, availableRange)) {
                return range(d0, d1, step);
            }
        }

        const ticks: _ModuleSupport.ScaleDomainTicks<number> = {
            interval: this.interval,
            tickCount: this.tickCount,
            minTickCount: this.minTickCount,
            maxTickCount: this.maxTickCount,
        };
        let step: number;
        if (this.nice && this.hasNiceRange()) {
            step = LinearAngleScale.getNiceStepAndTickCount(super.niceDomain(this.domain, ticks), ticks).step;
        } else {
            step = LinearScale.getTickStep(d0, d1, ticks);
        }

        return range(d0, d1, step);
    }

    private hasNiceRange() {
        const sortedRange = this.range.slice().sort((a, b) => a - b);
        const niceRanges = [Math.PI, 2 * Math.PI];
        return niceRanges.some((r) => isNumberEqual(r, sortedRange[1] - sortedRange[0]));
    }

    override niceDomain(domain: number[], ticks: _ModuleSupport.ScaleDomainTicks<number>): number[] {
        const niceDomain = super.niceDomain(domain, ticks);

        if (!this.hasNiceRange()) return niceDomain;

        const reversed = niceDomain[0] > niceDomain[1];
        const start = reversed ? niceDomain[1] : niceDomain[0];
        const { step, count } = LinearAngleScale.getNiceStepAndTickCount(niceDomain, ticks);
        const s = 1 / step; // Prevent floating point error
        const stop = step >= 1 ? Math.ceil(start / step + count) * step : Math.ceil((start + count * step) * s) / s;

        return reversed ? [stop, start] : [start, stop];
    }

    protected override getPixelRange() {
        return this.arcLength;
    }
}
