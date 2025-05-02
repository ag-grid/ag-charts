import { _ModuleSupport } from 'ag-charts-community';

const { OrdinalTimeScale, Property, TimeAxisParentLevel } = _ModuleSupport;

export class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_ModuleSupport.OrdinalTimeScale> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    override get primaryLabel(): _ModuleSupport.AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): _ModuleSupport.AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
    }

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new OrdinalTimeScale());
    }
}
