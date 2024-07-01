import { _ModuleSupport, _Scale } from 'ag-charts-community';
import { AngleAxisInterval } from '../angle-number/angleAxisInterval';
import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';
export declare class AngleCategoryAxis extends AngleAxis<string, _Scale.BandScale<string>> {
    static readonly className = "AngleCategoryAxis";
    static readonly type: "angle-category";
    groupPaddingInner: number;
    paddingInner: number;
    interval: AngleAxisInterval;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected generateAngleTicks(): {
        value: any;
        visible: boolean;
    }[];
    protected avoidLabelCollisions(labelData: AngleAxisLabelDatum[]): void;
}
