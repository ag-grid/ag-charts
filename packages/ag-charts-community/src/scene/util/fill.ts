import { isArray, isObject } from 'ag-charts-core';
import type { AgGradientFill } from 'ag-charts-types';

import type { Gradient } from '../gradient/gradient';

export type FillType = string | AgGradientFill | Gradient;

export function isGradientFill(fill: any): fill is AgGradientFill {
    return fill !== null && isObject(fill) && fill.type == 'gradient';
}

export function isGradientFillArray(fills: any): fills is AgGradientFill[] {
    return fills !== null && isArray(fills) && fills.every((fill) => isGradientFill(fill));
}

export function isStringFillArray(fills: any): fills is string[] {
    return fills !== null && isArray(fills) && fills.every((fill) => typeof fill === 'string');
}
