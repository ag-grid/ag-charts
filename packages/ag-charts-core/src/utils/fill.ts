import type { InternalAgColorType, InternalAgGradientColor } from 'ag-charts-core';
import { isArray, isObject } from 'ag-charts-core';
import type { AgImageFill, AgPatternColor } from 'ag-charts-types';

export function isGradientFill(fill: any): fill is InternalAgGradientColor {
    return isObject(fill) && fill.type == 'gradient';
}

export function isGradientFillArray(fills: any): fills is InternalAgColorType[] {
    return isArray(fills) && fills.every(isGradientFill);
}

export function isStringFillArray(fills: any): fills is string[] {
    return isArray(fills) && fills.every((fill) => typeof fill === 'string');
}

export function isPatternFill(fill: any): fill is AgPatternColor {
    return fill !== null && isObject(fill) && fill.type == 'pattern';
}

export function isImageFill(fill: any): fill is AgImageFill {
    return fill !== null && isObject(fill) && fill.type == 'image';
}

export function isGradientOrPatternFill(fill: any): fill is InternalAgGradientColor | AgPatternColor {
    return isGradientFill(fill) || isPatternFill(fill);
}
