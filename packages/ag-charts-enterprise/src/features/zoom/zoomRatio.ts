import { _ModuleSupport, _Util } from 'ag-charts-community';

import { UNIT } from './zoomUtils';

const { AND, GREATER_THAN, LESS_THAN, RATIO, ObserveChanges, Validate } = _ModuleSupport;

export class ZoomRatio {
    @ObserveChanges<ZoomRatio>((target, start) => {
        // if (target.initialStart == null && !target.hasRestored) {
        //     Logger.warnOnce('Property [zoom.ratioX] is deprecated. Use [initialState.zoom.ratioX] instead.');
        // }
        target.initialStart ??= start;
        const ratio = target.getRatioWithValues(start, target.end);
        if (ratio) target.onChange?.(ratio);
    })
    @Validate(AND(RATIO, LESS_THAN('end')), { optional: true })
    public start?: number;

    @ObserveChanges<ZoomRatio>((target, end) => {
        // if (target.initialEnd == null && !target.hasRestored) {
        //     Logger.warnOnce('Property [zoom.ratioY] is deprecated. Use [initialState.zoom.ratioY] instead.');
        // }
        target.initialEnd ??= end;
        const ratio = target.getRatioWithValues(target.start, end);
        if (ratio) target.onChange?.(ratio);
    })
    @Validate(AND(RATIO, GREATER_THAN('start')), { optional: true })
    public end?: number;

    private initialStart?: number;
    private initialEnd?: number;
    // private hasRestored = false;

    constructor(private readonly onChange: (ratio?: { min: number; max: number }) => void) {}

    public getRatio() {
        return this.getRatioWithValues(this.start, this.end);
    }

    public getInitialRatio() {
        return this.getRatioWithValues(this.initialStart, this.initialEnd);
    }

    public restore(start?: number, end?: number) {
        // this.hasRestored = true;

        this.initialStart = start;
        this.initialEnd = end;
        this.start = start;
        this.end = end;
        this.onChange(this.getRatio());
    }

    private getRatioWithValues(start?: number, end?: number) {
        if (start == null && end == null) return;

        return {
            min: start ?? UNIT.min,
            max: end ?? UNIT.max,
        };
    }
}
