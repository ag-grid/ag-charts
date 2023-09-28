import { _ModuleSupport, _Scale, _Util } from 'ag-charts-community';

const { LinearScale } = _Scale;
const { range } = _Util;

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
        
        const angleStep = Math.PI / 4;
        const { range: scaleRange } = this;
        let tickStep = this.invert(scaleRange[0] + angleStep) - d0;
        if (tickStep > 1e-15) {
            tickStep = parseFloat(tickStep.toPrecision(15));
        }
        const ticks = range(d0, d1, tickStep);
        if (ticks[ticks.length - 1] > d1) {
            ticks.pop();
            ticks.push(d1);
        }
        return ticks;
    }
}
