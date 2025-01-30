import { isObject } from 'ag-charts-core';
import type { AgGradientFill } from 'ag-charts-types';

import type { Gradient } from '../gradient/gradient';

export type FillType = string | AgGradientFill | Gradient;

export function isGradientFill(fill: any): fill is AgGradientFill {
    return fill !== null && isObject(fill) && fill.type == 'gradient';
}
