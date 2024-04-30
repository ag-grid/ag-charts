import type { ModuleContext } from '../../module/moduleContext';
import { LinearScale } from '../../scale/linearScale';
import type { LogScale } from '../../scale/logScale';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';
declare class NumberAxisTick extends AxisTick<LinearScale | LogScale, number> {
    minSpacing: number;
    maxSpacing: number;
}
export declare class NumberAxis extends CartesianAxis<LinearScale | LogScale, number> {
    static readonly className: string;
    static readonly type: string;
    constructor(moduleCtx: ModuleContext, scale?: LinearScale | LogScale);
    normaliseDataDomain(d: number[]): {
        domain: number[];
        clipped: boolean;
    };
    min: number;
    max: number;
    protected createTick(): NumberAxisTick;
    updateSecondaryAxisTicks(primaryTickCount: number | undefined): any[];
    formatDatum(datum: number): string;
}
export {};
