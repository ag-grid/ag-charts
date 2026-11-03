import type { AgDropShadowOptions, CssColor, Opacity, PixelSize, Ratio } from 'ag-charts-types';

// Undocumented options: accepted at runtime but absent from the public `ag-charts-types` options.

/** The public shadow options with the undocumented fields. */
export interface InternalAgDropShadowOptions extends AgDropShadowOptions {
    /** The fill colour of the shadow. The deprecated `color` is its alias. */
    fill?: CssColor;
    /** The opacity of the shadow's fill, from `0` to `1`. It multiplies any alpha that `fill` already has. */
    fillOpacity?: Opacity;
    /** How far, in pixels, the shadow grows beyond the shape that casts it, before the blur is applied. */
    spread?: PixelSize;
}

export interface InternalAgGlowOptions {
    /** Whether the glow is visible. */
    enabled?: boolean;
    /** The fill colour of the glow. Defaults to the fill of the item that glows, or its stroke if it has no fill. */
    fill?: CssColor;
    /** The opacity of the glow's fill, from `0` to `1`. It multiplies any alpha that `fill` already has. */
    fillOpacity?: Opacity;
    /** The radius of the glow's blur, in pixels. */
    blur?: PixelSize;
    /** How far, in pixels, the glow grows beyond the item before the blur is applied. */
    spread?: PixelSize;
}

/** Highlight style options for an item that can cast a `glow`. */
export interface InternalAgGlowHighlightStyleOptions {
    glow?: InternalAgGlowOptions;
}

/** Options that carry a `shadow` which the public type does not declare, or declares without the undocumented fields. */
export interface WithInternalShadow {
    shadow?: InternalAgDropShadowOptions;
}

/** Theme params the implementation reads that are not part of the public theme params. */
export interface InternalAgThemeParams {
    shadowFillOpacity?: Ratio;
}
