import type { AgImageFill, AgPatternColor, AgSolidColor } from 'ag-charts-types';

import { isArray, isObject } from '../data/typeGuards';
import { Color } from '../format/color';
import type { InternalAgColorType, InternalAgGradientColor } from '../options/normalised/normalisedCommonOptions';

export function isSolidFill(fill: any): fill is AgSolidColor {
    return isObject(fill) && fill.type == 'solid';
}

/** A solid fill's colour with its `fillOpacity` folded into the alpha, for a fill with no `fillOpacity` beside it. */
export function solidFillColour(fill: AgSolidColor): string | undefined {
    const { fill: colour, fillOpacity } = fill;
    if (colour == null || fillOpacity == null || fillOpacity === 1) return colour;

    try {
        const { r, g, b, a } = Color.fromString(colour);
        return new Color(r, g, b, a * fillOpacity).toString();
    } catch {
        return colour;
    }
}

/** The colour of a plain or solid fill, or undefined for a gradient, pattern or image. */
export function plainFillColour(fill: unknown): string | undefined {
    if (isSolidFill(fill)) return solidFillColour(fill);
    return typeof fill === 'string' ? fill : undefined;
}

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
