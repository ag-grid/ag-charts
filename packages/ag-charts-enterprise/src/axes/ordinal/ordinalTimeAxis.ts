import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const { OrdinalTimeScale } = _Scene;
const { dateToNumber } = _ModuleSupport;

export class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_Scene.OrdinalTimeScale> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new OrdinalTimeScale());
    }

    override normaliseDataDomain(d: Date[]) {
        const domain = [];
        const uniqueValues = new Set();
        for (const v of d) {
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

    protected override onLabelFormatChange(ticks: any[], format?: string) {
        if (format) {
            super.onLabelFormatChange(ticks, format);
        } else {
            // For time axis labels to look nice, even if date format wasn't set.
            this.labelFormatter = this.scale.tickFormat({ ticks });
        }
    }
}
