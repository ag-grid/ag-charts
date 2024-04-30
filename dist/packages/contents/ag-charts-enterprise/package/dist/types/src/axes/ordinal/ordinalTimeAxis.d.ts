import { _ModuleSupport, _Scale } from 'ag-charts-community';
declare class OrdinalTimeAxisTick extends _ModuleSupport.AxisTick<_Scale.OrdinalTimeScale, number | Date> {
    minSpacing: number;
    maxSpacing: number;
}
export declare class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_Scale.OrdinalTimeScale> {
    static readonly className: "OrdinalTimeAxis";
    static readonly type: "ordinal-time";
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected createTick(): OrdinalTimeAxisTick;
    normaliseDataDomain(d: Date[]): {
        domain: Date[];
        clipped: boolean;
    };
    protected onLabelFormatChange(ticks: any[], domain: any[], format?: string): void;
}
export {};
