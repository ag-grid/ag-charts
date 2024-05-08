import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const { OrdinalTimeScale } = _Scale;
const { dateToNumber, Validate, Default, MAX_SPACING, MIN_SPACING } = _ModuleSupport;

class OrdinalTimeAxisTick extends _ModuleSupport.AxisTick<_Scale.OrdinalTimeScale, number | Date> {
    @Validate(MIN_SPACING)
    override minSpacing: number = NaN;

    @Validate(MAX_SPACING)
    @Default(NaN)
    override maxSpacing: number = NaN;
}

export class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_Scale.OrdinalTimeScale> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new OrdinalTimeScale());
    }

    protected override createTick() {
        return new OrdinalTimeAxisTick();
    }

    override normaliseDataDomain(d: Date[]) {
        const domain = [];
        const uniqueValues = new Set();
        for (let v of d) {
            if (typeof v === 'number') {
                v = new Date(v);
            }
            const key = dateToNumber(v);
            if (!uniqueValues.has(key)) {
                uniqueValues.add(key);
                // Only add unique values
                domain.push(v);
            }
        }

        domain.sort((a, b) => dateToNumber(a) - dateToNumber(b));

        return { domain, clipped: false };
    }

    protected override onLabelFormatChange(ticks: any[], fractionDigits: number, domain: any[], format?: string) {
        if (format) {
            super.onLabelFormatChange(ticks, fractionDigits, domain, format);
        } else {
            // For time axis labels to look nice, even if date format wasn't set.
            this.labelFormatter = this.scale.tickFormat({ ticks, domain });
        }
    }
}
