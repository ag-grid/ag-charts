import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const { OrdinalTimeScale } = _Scene;

export class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_Scene.OrdinalTimeScale> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new OrdinalTimeScale());
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
