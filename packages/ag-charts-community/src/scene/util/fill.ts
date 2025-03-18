import { isArray, isObject } from 'ag-charts-core';
import type { AgGradientColor } from 'ag-charts-types';
import type { AgPatternColor } from 'ag-charts-types';

export function isGradientFill(fill: any): fill is AgGradientColor {
    return isObject(fill) && fill.type == 'gradient';
}

export function isGradientFillArray(fills: any): fills is AgGradientColor[] {
    return isArray(fills) && fills.every(isGradientFill);
}

export function isStringFillArray(fills: any): fills is string[] {
    return isArray(fills) && fills.every((fill) => typeof fill === 'string');
}

export function isPatternFill(fill: any): fill is AgPatternColor {
    return fill !== null && isObject(fill) && fill.type == 'pattern';
}

export function isGradientOrPatternFill(fill: any): fill is AgGradientColor | AgPatternColor {
    return isGradientFill(fill) || isPatternFill(fill);
}
