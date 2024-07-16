import { _ModuleSupport } from 'ag-charts-community';
import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';
import { LinearAngleScale } from './linearAngleScale';
declare class AngleNumberAxisTick extends _ModuleSupport.AxisTick<LinearAngleScale, number> {
    minSpacing: number;
    maxSpacing: number;
}
export declare class AngleNumberAxis extends AngleAxis<number, LinearAngleScale> {
    static readonly className = "AngleNumberAxis";
    static readonly type: "angle-number";
    shape: "circle";
    min: number;
    max: number;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    normaliseDataDomain(d: number[]): {
        domain: number[];
        clipped: boolean;
    };
    protected createTick(): AngleNumberAxisTick;
    protected getRangeArcLength(): number;
    protected generateAngleTicks(): {
        value: any;
        visible: boolean;
    }[];
    protected avoidLabelCollisions(labelData: AngleAxisLabelDatum[]): void;
}
export {};
