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
     * Whether the glow is visible. Setting a glow without this turns it on, so `glow: {}` is enough.
     *
     * Default: `false` until the glow is set
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
    /**
     * How far, in pixels, the glow starts from the item. Set `gap` to keep the item clear of the glow: unset, the glow is cast
     * like a shadow, so it shows through an item that is translucent. At `0` the item's own footprint is cut out of the glow,
     * and larger values move where the glow starts outwards. Negative values are not supported: they are ignored with a warning.
     *
     * Default: unset
     */
    gap?: PixelSize;
}

/**
 * What an `itemStyler` can return beyond the style of an item: the `shadow` and `glow` that the item casts. Each is merged,
 * field by field, over what the item would cast otherwise, so it takes precedence over the series, the highlight state and
 * the theme. A `glow` with no `enabled` turns the glow on, so `glow: {}` is enough, and `enabled: false` turns off what
 * the item would cast for this item alone. An item can cast both, and a `shadow` or `glow` that is invalid is
 * ignored with a warning, leaving what the item would cast otherwise.
 *
 * Neither is available in the params of a styler: branch on `highlightState` to cast one only in a state.
 *
 * Note: each distinct `blur` costs one blur per item whenever the chart is drawn again, so an item styler that
 * returns a different `blur` per item is slower than one that returns a shared value.
 */
export interface AgItemShadowStyle {
    /** The `shadow` of this item, merged over the `shadow` that it would cast. Setting it without `enabled` turns it on. */
    shadow?: Omit<AgDropShadowOptions, 'color'>;
    /** The `glow` of this item, merged over the `glow` that it would cast. Setting it without `enabled` turns it on. */
    glow?: AgGlowOptions;
}
