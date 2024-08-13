import { _ModuleSupport, _Util } from 'ag-charts-community';

const { AND, DATE, NUMBER, OR, ObserveChanges, Validate } = _ModuleSupport;
const { Logger } = _Util;

export class ZoomRange {
    @ObserveChanges<ZoomRange>((target, start) => {
        if (target.initialStart == null && !target.hasRestored) {
            Logger.warnOnce('Property [zoom.rangeX] is deprecated. Use [initialState.zoom.rangeX] instead.');
        }
        target.initialStart ??= start;
        const range = target.getRangeWithValues(start, target.end);
        if (range) target.onChange?.(range);
    })
    // @todo(AG-11069)
    @Validate(AND(OR(DATE, NUMBER) /* LESS_THAN('end') */), { optional: true })
    public start?: Date | number;

    @ObserveChanges<ZoomRange>((target, end) => {
        if (target.initialEnd == null && !target.hasRestored) {
            Logger.warnOnce('Property [zoom.rangeY] is deprecated. Use [initialState.zoom.rangeY] instead.');
        }
        target.initialEnd ??= end;
        const range = target.getRangeWithValues(target.start, end);
        if (range) target.onChange?.(range);
    })
    // @todo(AG-11069)
    @Validate(AND(OR(DATE, NUMBER) /* GREATER_THAN('start') */), { optional: true })
    public end?: Date | number;

    private domain?: Array<Date | number>;
    private initialStart?: Date | number;
    private initialEnd?: Date | number;
    private hasRestored = false;

    constructor(private readonly onChange: (range?: { min: number; max: number }) => void) {}

    public getRange() {
        return this.getRangeWithValues(this.start, this.end);
    }

    public getInitialRange() {
        return this.getRangeWithValues(this.initialStart, this.initialEnd);
    }

    public updateDomain(domain: Array<Date | number>) {
        this.domain = domain;
    }

    public restore(start?: Date | number, end?: Date | number) {
        this.hasRestored = true;

        this.initialStart = start;
        this.initialEnd = end;
        this.start = start;
        this.end = end;
        this.onChange(this.getRange());
    }

    public extendToEnd(extent: number) {
        return this.extendWith((end) => Number(end) - extent);
    }

    public extendWith(fn: (end: Date | number) => Date | number) {
        if (!this.domain) return;

        const [, end] = this.domain;
        if (end == null) return;

        const start = fn(end);
        const changed = this.start !== start || this.end !== end;

        this.end = end;
        this.start = start;

        // If neither start or end were changed, ensure we still call the `onChange` callback
        if (!changed) this.onChange?.(this.getRange());

        return { start, end };
    }

    public updateWith(fn: (start: Date | number, end: Date | number) => [Date | number, Date | number]) {
        if (!this.domain) return;

        let [start, end] = this.domain;
        [start, end] = fn(start, end);

        const changed = this.start !== start || this.end !== end;

        this.end = end;
        this.start = start;

        // If neither start or end were changed, ensure we still call the `onChange` callback
        if (!changed) this.onChange?.(this.getRange());

        return { start, end };
    }

    public extendAll() {
        if (!this.domain) return;

        const [start, end] = this.domain;

        const changed = this.start !== start || this.end !== end;

        this.start = start;
        this.end = end;

        // If neither start or end were changed, ensure we still call the `onChange` callback
        if (!changed) this.onChange?.(this.getRange());
    }

    private getRangeWithValues(start?: Date | number, end?: Date | number) {
        let [d0, d1] = this.domain ?? [];

        if ((start == null && end == null) || d0 == null || d1 == null) return;

        d0 = Number(d0);
        d1 = Number(d1);

        let min = 0;
        let max = 1;

        if (start != null) min = (Number(start) - d0) / (d1 - d0);
        if (end != null) max = (Number(end) - d0) / (d1 - d0);

        return { min, max };
    }
}
