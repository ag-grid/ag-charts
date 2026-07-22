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
    /** The distance the shadow expands beyond the shape, or contracts within it when negative, given in pixels. */
    spread?: PixelSize;
}
