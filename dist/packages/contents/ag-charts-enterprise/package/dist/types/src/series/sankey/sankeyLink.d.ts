import { _Scene } from 'ag-charts-community';
declare const Path: typeof _Scene.Path;
export declare class SankeyLink extends Path {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    height: number;
    inset: number;
    computeBBox(): _Scene.BBox | undefined;
    updatePath(): void;
}
export {};
