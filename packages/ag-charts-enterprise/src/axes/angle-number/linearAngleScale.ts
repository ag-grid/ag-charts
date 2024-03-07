import { _Scale, _Util } from 'ag-charts-community';

const { LinearScale, Invalidating } = _Scale;
const { isNumberEqual, range, isDenseInterval } = _Util;

export class LinearAngleScale extends LinearScale {
    @Invalidating
    arcLength: number = 0;

    private niceTickStep = 0;

    override ticks() {
        if (!this.domain || this.domain.length < 2 || this.domain.some((d) => !isFinite(d))) {
            return [];
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

        const step = this.nice && this.niceTickStep ? this.niceTickStep : this.getTickStep(d0, d1);
        return range(d0, d1, step);
    }

    private hasNiceRange() {
        const sortedRange = this.range.slice().sort((a, b) => a - b);
        const niceRanges = [Math.PI, 2 * Math.PI];
        return niceRanges.some((r) => isNumberEqual(r, sortedRange[1] - sortedRange[0]));
    }

    private getNiceStepAndTickCount() {
        const [start, stop] = this.niceDomain;
        let step = this.getTickStep(start, stop);
        const maxTickCount = isNaN(this.maxTickCount) ? Infinity : this.maxTickCount;
        const expectedTickCount = Math.abs(stop - start) / step;
        let niceTickCount = Math.pow(2, Math.ceil(Math.log(expectedTickCount) / Math.log(2)));
        if (niceTickCount > maxTickCount) {
            niceTickCount /= 2;
            step *= 2;
        }
        return {
            count: niceTickCount,
            step,
        };
    }

    protected override updateNiceDomain() {
        super.updateNiceDomain();

        if (!this.hasNiceRange()) {
            return;
        }

        const reversed = this.niceDomain[0] > this.niceDomain[1];
        const start = reversed ? this.niceDomain[1] : this.niceDomain[0];
        const { step, count } = this.getNiceStepAndTickCount();
        const s = 1 / step; // Prevent floating point error
        const stop = step >= 1 ? Math.ceil(start / step + count) * step : Math.ceil((start + count * step) * s) / s;

        this.niceDomain = reversed ? [stop, start] : [start, stop];
        this.niceTickStep = step;
    }

    protected override getPixelRange() {
        return this.arcLength;
    }
}
