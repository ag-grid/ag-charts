import { _ModuleSupport, _Scale } from 'ag-charts-community';
import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';
export declare class AngleCategoryAxis extends AngleAxis<string, _Scale.BandScale<string>> {
    static readonly className = "AngleCategoryAxis";
    static readonly type: "angle-category";
    groupPaddingInner: number;
    paddingInner: number;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    protected generateAngleTicks(): {
        value: any;
        visible: boolean;
    }[];
    protected avoidLabelCollisions(labelData: AngleAxisLabelDatum[]): void;
}
