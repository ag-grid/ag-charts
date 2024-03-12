import { _ModuleSupport, _Util } from 'ag-charts-community';

const { AND, DATE, GREATER_THAN, NUMBER, OR, ActionOnSet, isFiniteNumber, isValidDate, Validate } = _ModuleSupport;

export class ZoomRange {
    @ActionOnSet<ZoomRange>({
        changeValue(start) {
            this.initialStart ??= start;
            this.onChange?.(this.getRangeWithValues(start, this.end));
        },
    })
    @Validate(OR(DATE, NUMBER), { optional: true })
    public start?: Date | number;

    @ActionOnSet<ZoomRange>({
        changeValue(end) {
            this.initialEnd ??= end;
            this.onChange?.(this.getRangeWithValues(this.start, end));
        },
    })
    @Validate(AND(OR(DATE, NUMBER), GREATER_THAN('start')), { optional: true })
    public end?: Date | number;

    private domain?: Array<Date | number>;
    private initialStart?: number;
    private initialEnd?: number;

    constructor(private readonly onChange: (range?: { min: number; max: number }) => void) {}

    public getRange() {
        return this.getRangeWithValues(this.start, this.end);
    }

    public getInitialRange() {
        return this.getRangeWithValues(this.initialStart, this.initialEnd);
    }

    public extendToEnd(extent: number) {
        return this.extendWith((end) => Number(end) - extent);
    }

    public extendWith(fn: (end: Date | number) => Date | number) {
        if (!this.domain) return;

        const end = this.domain.at(-1);
        if (end == null) return;

        const start = fn(end);
        const changed = this.start !== start || this.end !== end;

        this.end = end;
        this.start = start;

        // If neither start or end were changed, ensure we still call the `onChange` callback
        if (!changed) this.onChange?.(this.getRange());
    }

    public extendAll() {
        if (!this.domain) return;

        const start = this.domain[0];
        const end = this.domain.at(-1);

        const changed = this.start !== start || this.end !== end;

        this.start = start;
        this.end = end;

        // If neither start or end were changed, ensure we still call the `onChange` callback
        if (!changed) this.onChange?.(this.getRange());
    }

    public updateAxis(axes: Array<_ModuleSupport.AxisLayout>) {
        const validAxis = axes.find(({ domain }) => {
            const isNumberAxis = !isFiniteNumber(domain[0]) || !isFiniteNumber(domain.at(-1));
            const isDateAxis = !isValidDate(domain[0]) || !isValidDate(domain.at(-1));

            return isNumberAxis || isDateAxis;
        });

        let domain = this.domain;

        if (!validAxis) return domain != null;

        let validAxisDomain = validAxis.domain;

        // Ensure a valid comparison of date objects by mapping to timestamps
        if (domain != null && domain[0] instanceof Date) {
            domain = domain.map((d) => (d instanceof Date ? d.getTime() : d));
            validAxisDomain = validAxisDomain.map((d) => (d instanceof Date ? d.getTime() : d));
        }

        const changed = domain == null || !_Util.areArrayItemsStrictlyEqual(domain, validAxisDomain);

        if (changed) {
            this.domain = validAxis.domain;
        }

        return changed;
    }

    private getRangeWithValues(start?: Date | number, end?: Date | number) {
        const { domain } = this;

        let d0 = domain?.[0];
        let d1 = domain?.at(-1);

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
