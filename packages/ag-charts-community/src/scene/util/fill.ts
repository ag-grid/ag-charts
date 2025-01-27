import { isObject } from 'ag-charts-core';
import type { AgGradientFill } from 'ag-charts-types';

export function isGradientFill(fill: any): fill is AgGradientFill {
    return fill !== null && isObject(fill) && fill.type == 'gradient';
}
