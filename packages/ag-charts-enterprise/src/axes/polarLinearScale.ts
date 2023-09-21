import { _ModuleSupport, _Scale, _Util } from 'ag-charts-community';

const { LinearScale } = _Scale;
const { range } = _Util;

export class PolarLinearScale extends LinearScale {
    ticks() {
        const count = 8;
        if (!this.domain || this.domain.length < 2 || this.domain.some((d) => !isFinite(d))) {
            return [];
        }
        this.refresh();
        const [d0, d1] = this.getDomain();
        const step = (d1 - d0) / count;
        return range(d0, d1, step);
    }
}
