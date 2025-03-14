import { isArray, isObject } from 'ag-charts-core';
import type { AgColorType, AgGradientColor } from 'ag-charts-types';

import type { Gradient } from '../gradient/gradient';

export type FillType = AgColorType | Gradient;

export function isGradientFill(fill: any): fill is AgGradientColor {
    return isObject(fill) && fill.type == 'gradient';
}

export function isGradientFillArray(fills: any): fills is AgGradientColor[] {
    return isArray(fills) && fills.every(isGradientFill);
}

export function isStringFillArray(fills: any): fills is string[] {
    return isArray(fills) && fills.every((fill) => typeof fill === 'string');
}
