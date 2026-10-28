import type { CssColor, PixelSize } from './types';

export interface AgDropShadowOptions {
    /** Whether the shadow is visible. */
    enabled?: boolean;
    /** The colour of the shadow. */
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
    /** The colour of the glow. */
    color?: CssColor;
    /** The radius of the glow's blur, in pixels. */
    blur?: PixelSize;
    /** How far, in pixels, the glow grows beyond the item before the blur is applied. */
    spread?: PixelSize;
}
