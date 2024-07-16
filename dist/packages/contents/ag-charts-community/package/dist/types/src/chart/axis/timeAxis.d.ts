import type { ModuleContext } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';
declare class TimeAxisTick extends AxisTick<TimeScale, number | Date> {
    minSpacing: number;
    maxSpacing: number;
}
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
    protected createTick(): TimeAxisTick;
    protected onLabelFormatChange(ticks: any[], domain: any[], format?: string): void;
    calculatePadding(): [number, number];
    formatDatum(datum: Date): string;
}
export {};
