import type { CssColor } from 'ag-charts-types';

import { getOffscreenCanvas } from '../dom/globalsProxy';
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

let tintable: boolean | undefined;

/** Makes {@link canTintShadows} answer `canTint` in place of the canvas, or probe the canvas again if it is undefined. */
export function overrideTintableShadows(canTint?: boolean) {
    tintable = canTint;
}

/**
 * Whether a canvas can blur a mask that holds silhouettes of many colours once, with its `filter`, so that a glow with no
 * `fill` makes one shadow for all of its items. Without it, a glow makes a shadow for each colour.
 */
export function canTintShadows(): boolean {
    if (tintable == null) {
        try {
            const context = new (getOffscreenCanvas())(1, 1).getContext('2d');
            tintable = context != null && 'filter' in context;
        } catch {
            tintable = false;
        }
    }
    return tintable;
}

interface ColourInfo {
    visible: boolean;
    alpha: number;
    /** The colour with its alpha removed, or the colour itself if it can't be read. */
    opaque: string;
}

const colourInfos = new Map<string, ColourInfo>();

function getColourInfo(colour: string): ColourInfo {
    let info = colourInfos.get(colour);
    if (info == null) {
        try {
            const { r, g, b, a } = Color.fromString(colour);
            info = { visible: a > 0, alpha: a, opaque: new Color(r, g, b, 1).toRgbaString() };
        } catch {
            info = { visible: false, alpha: 0, opaque: colour };
        }
        if (colourInfos.size >= MAX_FILLS_PER_SHADOW) colourInfos.delete(colourInfos.keys().next().value!);
        colourInfos.set(colour, info);
    }
    return info;
}

function isVisibleColour(colour: string): boolean {
    return colour !== 'none' && colour !== 'transparent' && getColourInfo(colour).visible;
}

/** The colour with its alpha removed, or the colour itself if it can't be read. */
export function getOpaqueColour(colour: string): string {
    return getColourInfo(colour).opaque;
}

/** The alpha of the colour, or 0 if it can't be read. */
export function getColourAlpha(colour: string): number {
    return getColourInfo(colour).alpha;
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
