import { _ModuleSupport, _Scale, _Util } from 'ag-charts-community';

const { LinearScale } = _Scale;
const { isNumberEqual, range } = _Util;

export class LinearAngleScale extends LinearScale {
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
            if (!this.isDenseInterval({ start: d0, stop: d1, interval: step })) {
                return range(d0, d1, step);
            }
        }

        if (this.nice) {
            const step = this.niceTickStep;
            return range(d0, d1, step);
        }

        const step = this.getTickStep(d0, d1);
        return range(d0, d1, step);
    }

    private hasNiceRange() {
        const range = this.range.slice().sort((a, b) => a - b);
        const niceRanges = [Math.PI, 2 * Math.PI];
        return niceRanges.some((r) => isNumberEqual(r, range[1] - range[0]));
    }

    private getNiceStepAndTickCount() {
        const [start, stop] = this.niceDomain;
        let step = this.getTickStep(start, stop);
        const maxTickCount = isNaN(this.maxTickCount) ? Infinity : this.maxTickCount;
        const expectedTickCount = (stop - start) / step;
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

        const start = this.niceDomain[0];
        const { step, count } = this.getNiceStepAndTickCount();
        const s = 1 / step; // Prevent floating point error
        const stop = step >= 1 ? Math.ceil(start / step + count) * step : Math.ceil((start + count * step) * s) / s;

        this.niceDomain = [start, stop];
        this.niceTickStep = step;
    }

    protected override getPixelRange() {
        return this.arcLength;
    }
}
