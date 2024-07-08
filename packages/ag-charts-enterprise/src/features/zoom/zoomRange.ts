import { _ModuleSupport, _Util } from 'ag-charts-community';

const { AND, DATE, NUMBER, OR, ActionOnSet, isFiniteNumber, isValidDate, Validate } = _ModuleSupport;

export class ZoomRange {
    @ActionOnSet<ZoomRange>({
        changeValue(start) {
            this.initialStart ??= start;
            this.onChange?.(this.axisId, this.getRangeWithValues(start, this.end));
        },
    })
    // @todo(AG-11069)
    @Validate(AND(OR(DATE, NUMBER) /* LESS_THAN('end') */), { optional: true })
    public start?: Date | number;

    @ActionOnSet<ZoomRange>({
        changeValue(end) {
            this.initialEnd ??= end;
            this.onChange?.(this.axisId, this.getRangeWithValues(this.start, end));
        },
    })
    // @todo(AG-11069)
    @Validate(AND(OR(DATE, NUMBER) /* GREATER_THAN('start') */), { optional: true })
    public end?: Date | number;

    private axisId?: string;
    private domain?: Array<Date | number>;
    private initialStart?: number;
    private initialEnd?: number;

    constructor(private readonly onChange: (axisId?: string, range?: { min: number; max: number }) => void) {}

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

        const [, end] = this.domain;
        if (end == null) return;

        const start = fn(end);
        const changed = this.start !== start || this.end !== end;

        this.end = end;
        this.start = start;

        // If neither start or end were changed, ensure we still call the `onChange` callback
        if (!changed) this.onChange?.(this.axisId, this.getRange());
    }

    public updateWith(fn: (start: Date | number, end: Date | number) => [Date | number, Date | number]) {
        if (!this.domain) return;

        let [start, end] = this.domain;
        [start, end] = fn(start, end);

        const changed = this.start !== start || this.end !== end;

        this.end = end;
        this.start = start;

        // If neither start or end were changed, ensure we still call the `onChange` callback
        if (!changed) this.onChange?.(this.axisId, this.getRange());
    }

    public extendAll() {
        if (!this.domain) return;

        const [start, end] = this.domain;

        const changed = this.start !== start || this.end !== end;

        this.start = start;
        this.end = end;

        // If neither start or end were changed, ensure we still call the `onChange` callback
        if (!changed) this.onChange?.(this.axisId, this.getRange());
    }

    public updateAxis(axes: Array<_ModuleSupport.AxisLayout & { id: string }>) {
        const validAxis = axes.find(({ domain }) => {
            const isNumberAxis = !isFiniteNumber(domain[0]) || !isFiniteNumber(domain.at(-1));
            const isDateAxis = !isValidDate(domain[0]) || !isValidDate(domain.at(-1));

            return isNumberAxis || isDateAxis;
        });

        if (!validAxis) return this.domain != null;

        this.axisId = validAxis.id;
        let validAxisDomain = validAxis.domain;

        if (validAxisDomain != null) {
            // We only need to compare the extents of the domain, not the full category domain
            validAxisDomain = [validAxisDomain[0], validAxisDomain.at(-1)];

            // Ensure a valid comparison of date objects by mapping to timestamps
            if (validAxisDomain[0] instanceof Date && validAxisDomain[1] instanceof Date) {
                validAxisDomain = [validAxisDomain[0].getTime(), validAxisDomain[1].getTime()];
            }
        }

        const changed = this.domain == null || !_Util.areArrayItemsStrictlyEqual(this.domain, validAxisDomain);

        if (changed) {
            this.domain = validAxisDomain;
        }

        return changed;
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
