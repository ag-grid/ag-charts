import { _ModuleSupport } from 'ag-charts-community';
import type { AngleAxisLabelDatum } from '../angle/angleAxis';
import { AngleAxis } from '../angle/angleAxis';
import { AngleAxisInterval } from './angleAxisInterval';
import { LinearAngleScale } from './linearAngleScale';
export declare class AngleNumberAxis extends AngleAxis<number, LinearAngleScale> {
    static readonly className = "AngleNumberAxis";
    static readonly type: "angle-number";
    shape: "circle";
    min: number;
    max: number;
    interval: AngleAxisInterval;
    constructor(moduleCtx: _ModuleSupport.ModuleContext);
    normaliseDataDomain(d: number[]): {
        domain: number[];
        clipped: boolean;
    };
    protected getRangeArcLength(): number;
    protected generateAngleTicks(): {
        value: any;
        visible: boolean;
    }[];
    protected avoidLabelCollisions(labelData: AngleAxisLabelDatum[]): void;
}
