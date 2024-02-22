import { _Scale } from 'ag-charts-community';
declare const LinearScale: typeof _Scale.LinearScale;
export declare class LinearAngleScale extends LinearScale {
    arcLength: number;
    private niceTickStep;
    ticks(): never[] | import("ag-charts-community/dist/types/src/util/ticks").NumericTicks;
    private hasNiceRange;
    private getNiceStepAndTickCount;
    protected updateNiceDomain(): void;
    protected getPixelRange(): number;
}
export {};
