import { isArray, isObject } from 'ag-charts-core';
import type { AgGradientColor, AgGradientColorBounds, AgGradientType, CssColor } from 'ag-charts-types';
import type { AgPatternColor } from 'ag-charts-types';

export interface InternalAgGradientColor extends AgGradientColor {
    /** Format of the gradient */
    gradient?: AgGradientType;
    /** The domain of the color gradient, defaults to item. */
    bounds?: AgGradientColorBounds;
    /** Reverse the order of colour stops. */
    reverse?: boolean;
}

export type InternalAgColorType = CssColor | InternalAgGradientColor | AgPatternColor;

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

export function isGradientOrPatternFill(fill: any): fill is InternalAgGradientColor | AgPatternColor {
    return isGradientFill(fill) || isPatternFill(fill);
}
