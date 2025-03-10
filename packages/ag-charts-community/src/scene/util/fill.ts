import { isArray, isObject } from 'ag-charts-core';
import type { AgFillType, AgGradientFill } from 'ag-charts-types';

import type { Gradient } from '../gradient/gradient';

export type FillType = AgFillType | Gradient;

export type DefaultFillStyle = { defaultColorRange: string[] };

export function isGradientFill(fill: any): fill is AgGradientFill {
    return isObject(fill) && fill.type == 'gradient';
}

export function isGradientFillArray(fills: any): fills is AgGradientFill[] {
    return isArray(fills) && fills.every(isGradientFill);
}

export function isStringFillArray(fills: any): fills is string[] {
    return isArray(fills) && fills.every((fill) => typeof fill === 'string');
}
