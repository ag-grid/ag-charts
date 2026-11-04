import type { CssColor, Opacity, PixelSize } from './types';

export interface AgDropShadowOptions {
    /** Whether the shadow is visible. */
    enabled?: boolean;
    /**
     * The fill colour of the shadow.
     *
     * Default: `'#000'`
     */
    fill?: CssColor;
    /**
     * The opacity of the shadow's fill, from `0` to `1`. It multiplies any alpha that `fill` already has.
     *
     * Default: `1` if `fill` is set, otherwise the opacity of the theme's default shadow (`0.5` in the light theme, `1` in the dark theme)
     */
    fillOpacity?: Opacity;
    /**
     * The colour of the shadow.
     *
     * @deprecated Use `fill` instead.
     */
    color?: CssColor;
    /** The horizontal offset in pixels for the shadow. */
    xOffset?: PixelSize;
    /** The vertical offset in pixels for the shadow. */
    yOffset?: PixelSize;
    /** The radius of the shadow's blur, given in pixels. */
    blur?: PixelSize;
    /**
     * How far, in pixels, the shadow grows beyond the shape that casts it, before the blur is applied.
     * Negative values are not supported: they are ignored with a warning.
     *
     * Default: `0`
     */
    spread?: PixelSize;
}

export interface AgGlowOptions {
    /**
     * Whether the glow is visible.
     *
     * Default: `false`
     */
    enabled?: boolean;
    /**
     * The fill colour of the glow.
     *
     * Default: the fill of the item that glows, or its stroke if it has no fill
     */
    fill?: CssColor;
    /**
     * The opacity of the glow's fill, from `0` to `1`. It multiplies any alpha that `fill` already has.
     *
     * Default: `0.4`
     */
    fillOpacity?: Opacity;
    /**
     * The radius of the glow's blur, in pixels.
     *
     * Default: `2`
     */
    blur?: PixelSize;
    /**
     * How far, in pixels, the glow grows beyond the item before the blur is applied.
     *
     * Default: `4`
     */
    spread?: PixelSize;
}
