import { _ModuleSupport, _Scale, _Util } from 'ag-charts-community';

const { LinearScale } = _Scale;
const { isNumberEqual, range, tickStep } = _Util;

export class LinearAngleScale extends LinearScale {
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
        
        const { tickCount } = this;
        const minTickCount = isNaN(this.minTickCount) ? 1 : this.minTickCount;
        const maxTickCount = isNaN(this.maxTickCount) ? Infinity : this.maxTickCount; 
        const angleRange = this.range.slice().sort((a, b) => a - b);

        const rawTickCount = Math.max(minTickCount, Math.min(maxTickCount, tickCount));
        const rawCircleTickCount = rawTickCount / (angleRange[1] - angleRange[0]) * 2 * Math.PI;
        const niceCircleTickCount = Math.pow(2, Math.ceil(Math.log(rawCircleTickCount) / Math.log(2)));
        const angleStep = 2 * Math.PI / niceCircleTickCount;
        
        let tickStep = this.invert(angleRange[0] + angleStep) - d0;
        if (tickStep > 1e-12) {
            tickStep = parseFloat(tickStep.toPrecision(12));
        }
        const ticks = range(d0, d1, tickStep);
        if (ticks[ticks.length - 1] > d1) {
            ticks.pop();
            ticks.push(d1);
        }
        return ticks;
    }

    protected updateNiceDomain() {
        const range = this.range.slice().sort((a, b) => a - b);
        const niceRanges = [Math.PI, 2 * Math.PI];
        if (!niceRanges.some((r) => isNumberEqual(r, range[1] - range[0]))) {
            return super.updateNiceDomain();
        }
        const { tickCount } = this;
        const minTickCount = isNaN(this.minTickCount) ? 1 : this.minTickCount;
        const maxTickCount = isNaN(this.maxTickCount) ? Infinity : this.maxTickCount;

        let [start, stop] = this.domain;
        let step = this.interval ?? tickStep(start, stop, tickCount, minTickCount, maxTickCount);
        if (step >= 1) {
            start = Math.floor(start / step) * step;
        } else {
            const s = 1 / step; // Prevent floating point error
            start = Math.floor(start * s) / s;
        }
        const expectedTickCount = (stop - start) / step;
        let niceTickCount = Math.pow(2, Math.ceil(Math.log(expectedTickCount) / Math.log(2)));
        if (niceTickCount > maxTickCount) {
            niceTickCount /= 2;
            step *= 2;
        }
        if (step >= 1) {
            stop = Math.ceil(start / step + niceTickCount) * step;
        } else {
            const s = 1 / step; // Prevent floating point error
            stop = Math.ceil((start + niceTickCount * step) * s) / s;
        }
        this.niceDomain = [start, stop];
    }
}
