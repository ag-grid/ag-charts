import type { ModuleContext } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import { CartesianAxis } from './cartesianAxis';
export declare class TimeAxis extends CartesianAxis<TimeScale, number | Date> {
    static readonly className = "TimeAxis";
    static readonly type: "time";
    constructor(moduleCtx: ModuleContext);
    min?: Date | number;
    max?: Date | number;
    normaliseDataDomain(d: Date[]): {
        domain: Date[];
        clipped: boolean;
    };
    protected onFormatChange(ticks: any[], fractionDigits: number, domain: any[], format?: string): void;
    calculatePadding(): [number, number];
}
