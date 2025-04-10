import { _ModuleSupport } from 'ag-charts-community';

const { OrdinalTimeScale, Property, TimeAxisDivision } = _ModuleSupport;

export class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_ModuleSupport.OrdinalTimeScale> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    @Property
    readonly division = new TimeAxisDivision();

    override get primaryLabel(): _ModuleSupport.AxisLabel | undefined {
        return this.division.enabled ? this.division.label : undefined;
    }

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new OrdinalTimeScale());
    }
}
