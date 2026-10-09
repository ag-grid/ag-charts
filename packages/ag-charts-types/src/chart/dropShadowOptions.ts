import type { CssColor, PixelSize } from './types';

/**
 * A drop shadow.
 *
 * A shadow adds to the time taken to render a series, and the cost grows with the number of items that cast one. The
 * shadows of a series are blurred together, but every item that casts a shadow is drawn an extra time, and a `spread`
 * makes each of those draws costlier. On a series of tens of thousands of items or more, shadows can noticeably increase
 * the time to draw or update the chart, so consider leaving them off.
 */
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
