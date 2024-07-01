import type { ModuleContext } from '../../module/moduleContext';
import { LinearScale } from '../../scale/linearScale';
import type { LogScale } from '../../scale/logScale';
import { CartesianAxis } from './cartesianAxis';
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
    updateSecondaryAxisTicks(primaryTickCount: number | undefined): any[];
}
