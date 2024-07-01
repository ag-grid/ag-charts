import { _Scene } from 'ag-charts-community';
declare const Path: typeof _Scene.Path;
export declare class ChordLink extends Path {
    centerX: number;
    centerY: number;
    radius: number;
    startAngle1: number;
    endAngle1: number;
    startAngle2: number;
    endAngle2: number;
    tension: number;
    private tensionedCurveTo;
    updatePath(): void;
}
export {};
