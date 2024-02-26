import { _ModuleSupport } from 'ag-charts-community';

const { DATE, NUMBER, OR, ActionOnSet, isFiniteNumber, isValidDate, Validate } = _ModuleSupport;

export class ZoomRange {
    @ActionOnSet<ZoomRange>({
        changeValue(start) {
            this.onChange?.(this.getRangeWithValues(start, this.end));
        },
    })
    @Validate(OR(DATE, NUMBER), { optional: true })
    public start?: Date | number;

    @ActionOnSet<ZoomRange>({
        changeValue(end) {
            this.onChange?.(this.getRangeWithValues(this.start, end));
        },
    })
    @Validate(OR(DATE, NUMBER), { optional: true })
    public end?: Date | number;

    private domain?: Array<Date | number>;

    constructor(private readonly onChange: (range?: { min: number; max: number }) => void) {}

    getRange() {
        return this.getRangeWithValues(this.start, this.end);
    }

    updateAxis(axes: Array<_ModuleSupport.AxisLayout>) {
        const validAxis = axes.find(({ domain }) => {
            const isNumberAxis = !isFiniteNumber(domain[0]) || !isFiniteNumber(domain.at(-1));
            const isDateAxis = !isValidDate(domain[0]) || !isValidDate(domain.at(-1));

            return isNumberAxis || isDateAxis;
        });

        if (!validAxis) return;

        this.domain = validAxis.domain;
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
