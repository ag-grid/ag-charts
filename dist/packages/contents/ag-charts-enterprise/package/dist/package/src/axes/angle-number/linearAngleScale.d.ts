import { _Scale } from 'ag-charts-community';
declare const LinearScale: typeof _Scale.LinearScale;
export declare class LinearAngleScale extends LinearScale {
    arcLength: number;
    private niceTickStep;
    protected cacheProps: Array<keyof this>;
    ticks(): import("packages/ag-charts-community/dist/package/src/util/ticks").NumericTicks | never[];
    private hasNiceRange;
    private getNiceStepAndTickCount;
    protected updateNiceDomain(): void;
    protected getPixelRange(): number;
}
export {};
