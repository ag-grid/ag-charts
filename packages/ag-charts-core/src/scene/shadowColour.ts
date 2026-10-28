import type { CssColor } from 'ag-charts-types';

import { Color } from '../format/color';
import { isGradientFill, isPatternFill } from '../geometry/fill';
import type {
    NormalisedDropShadowOptions,
    ResolvedDropShadowOptions,
} from '../options/normalised/normalisedCommonOptions';

interface ColourMemo {
    fill: string;
    fillOpacity: number;
    colour: string;
}

const colours = new WeakMap<ResolvedDropShadowOptions, ColourMemo>();

/** The colour that a shadow casts in: its `fill` with its `fillOpacity` multiplying any alpha that the `fill` has. */
export function getShadowColour(shadow: ResolvedDropShadowOptions): string {
    const { fill, fillOpacity = 1 } = shadow;
    if (fillOpacity === 1) return fill;

    const memo = colours.get(shadow);
    if (memo?.fill === fill && memo.fillOpacity === fillOpacity) return memo.colour;

    const colour = scaleColourAlpha(fill, fillOpacity) ?? fill;
    colours.set(shadow, { fill, fillOpacity, colour });
    return colour;
}

/** The colour with its alpha scaled, or undefined if it can't be read. */
export function scaleColourAlpha(colour: string, scale: number): string | undefined {
    try {
        const { r, g, b, a } = Color.fromString(colour);
        return new Color(r, g, b, a * scale).toRgbaString();
    } catch {
        return;
    }
}

/** More colours than a glow normally takes: a glow over a colour scale takes the colour of each of its items. */
const MAX_FILLS_PER_SHADOW = 256;

const withFills = new WeakMap<NormalisedDropShadowOptions, Map<string, ResolvedDropShadowOptions>>();

/** `shadow` with the `fill` that its caster supplies, as one object for each fill so that casters share it. */
export function withShadowFill(shadow: NormalisedDropShadowOptions, fill: string): ResolvedDropShadowOptions {
    let fills = withFills.get(shadow);
    if (fills == null) {
        fills = new Map();
        withFills.set(shadow, fills);
    }

    let resolved = fills.get(fill);
    if (resolved == null) {
        if (fills.size >= MAX_FILLS_PER_SHADOW) fills.delete(fills.keys().next().value!);
        resolved = { ...shadow, fill };
        fills.set(fill, resolved);
    }
    return resolved;
}

const visibleColours = new Map<string, boolean>();

function isVisibleColour(colour: string): boolean {
    if (colour === 'none' || colour === 'transparent') return false;

    let visible = visibleColours.get(colour);
    if (visible == null) {
        try {
            visible = Color.fromString(colour).a > 0;
        } catch {
            visible = false;
        }
        if (visibleColours.size >= MAX_FILLS_PER_SHADOW) visibleColours.delete(visibleColours.keys().next().value!);
        visibleColours.set(colour, visible);
    }
    return visible;
}

/** A paint's solid colour: a gradient's first stop or a pattern's fill. Undefined for an image or no paint. */
export function getSolidColour(paint: unknown, opacity: number = 1): CssColor | undefined {
    if (paint == null || Number.isNaN(opacity) || opacity <= 0) return;

    let colour: unknown = paint;
    if (isGradientFill(paint)) {
        colour = paint.colorStops?.[0]?.color;
    } else if (isPatternFill(paint)) {
        colour = paint.fill;
    }
    return typeof colour === 'string' && isVisibleColour(colour) ? colour : undefined;
}
