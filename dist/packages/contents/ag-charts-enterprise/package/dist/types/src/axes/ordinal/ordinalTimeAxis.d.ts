import { _ModuleSupport, _Scene } from 'ag-charts-community';
export declare class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_Scene.OrdinalTimeScale> {
    static readonly className: "OrdinalTimeAxis";
    static readonly type: "ordinal-time";
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    normaliseDataDomain(d: Date[]): {
        domain: Date[];
        clipped: boolean;
    };
    protected onLabelFormatChange(ticks: any[], format?: string): void;
}
