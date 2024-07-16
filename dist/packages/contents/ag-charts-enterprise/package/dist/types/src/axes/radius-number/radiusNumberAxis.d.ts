import { _ModuleSupport } from 'ag-charts-community';
import { RadiusAxis } from '../radius/radiusAxis';
type TickDatum = {
    tickLabel: string;
    tick: any;
    tickId: string;
    translationY: number;
};
export declare class RadiusNumberAxis extends RadiusAxis {
    static readonly className = "RadiusNumberAxis";
    static readonly type: "radius-number";
    shape: 'polygon' | 'circle';
    min: number;
    max: number;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected prepareTickData(data: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[];
    protected getTickRadius(tickDatum: TickDatum): number;
    normaliseDataDomain(d: number[]): {
        domain: number[];
        clipped: boolean;
    };
}
export {};
