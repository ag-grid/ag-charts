import { _ModuleSupport } from 'ag-charts-community';
import { RadiusAxis } from '../radius/radiusAxis';
export declare class RadiusCategoryAxis extends RadiusAxis {
    static readonly className = "RadiusCategoryAxis";
    static readonly type: "radius-category";
    shape: "circle";
    groupPaddingInner: number;
    paddingInner: number;
    paddingOuter: number;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected prepareTickData(data: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[];
    protected getTickRadius(tickDatum: _ModuleSupport.TickDatum): number;
}
