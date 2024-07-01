import { _ModuleSupport, _Scale } from 'ag-charts-community';
export declare class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_Scale.OrdinalTimeScale> {
    static readonly className: "OrdinalTimeAxis";
    static readonly type: "ordinal-time";
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    normaliseDataDomain(d: Date[]): {
        domain: Date[];
        clipped: boolean;
    };
    protected onFormatChange(ticks: any[], fractionDigits: number, domain: any[], format?: string): void;
}
