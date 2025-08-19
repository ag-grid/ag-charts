import type { Point } from 'ag-charts-core';

export interface SizedPoint extends Point {
    size: number;
    focusSize?: number;
}
