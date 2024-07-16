import type { _ModuleSupport } from 'ag-charts-community';
export declare function polygonPointSearch(polygons: _ModuleSupport.Position[][], precision: number, valueFn: (polygons: _ModuleSupport.Position[][], x: number, y: number, stride: number) => {
    distance: number;
    maxDistance: number;
}): {
    x: number;
    y: number;
    distance: number;
} | undefined;
