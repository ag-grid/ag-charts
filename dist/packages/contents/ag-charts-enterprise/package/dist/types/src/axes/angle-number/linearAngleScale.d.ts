import { _Scale } from 'ag-charts-community';
declare const LinearScale: typeof _Scale.LinearScale;
export declare class LinearAngleScale extends LinearScale {
    arcLength: number;
    private niceTickStep;
    ticks(): number[];
    private hasNiceRange;
    private getNiceStepAndTickCount;
    protected updateNiceDomain(): void;
    protected getPixelRange(): number;
}
export {};
