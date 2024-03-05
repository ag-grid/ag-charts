import { _ModuleSupport, _Util } from 'ag-charts-community';

import { UNIT } from './zoomUtils';

const { ActionOnSet } = _ModuleSupport;

export class ZoomRatio {
    @ActionOnSet<ZoomRatio>({
        changeValue(start?: number) {
            this.initialStart ??= start;
            this.onChange?.(this.getRatioWithValues(start, this.end));
        },
    })
    public start?: number;

    @ActionOnSet<ZoomRatio>({
        changeValue(end?: number) {
            this.initialEnd ??= end;
            this.onChange?.(this.getRatioWithValues(this.start, end));
        },
    })
    public end?: number;

    private initialStart?: number;
    private initialEnd?: number;

    constructor(private readonly onChange: (ratio?: { min: number; max: number }) => void) {}

    public getRatio() {
        return this.getRatioWithValues(this.start, this.end);
    }

    public getInitialRatio() {
        return this.getRatioWithValues(this.initialStart, this.initialEnd);
    }

    private getRatioWithValues(start?: number, end?: number) {
        if (start == null && end == null) return;

        return {
            min: start ?? UNIT.min,
            max: end ?? UNIT.max,
        };
    }
}
