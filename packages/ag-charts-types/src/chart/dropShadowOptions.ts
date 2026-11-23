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
     * How far, in pixels, the glow starts from the item.
     *
     * Default: unset
     */
    gap?: PixelSize;
}

/** What an `itemStyler` can return beyond the style of an item: the `shadow` and `glow` that the item casts. */
export interface AgItemShadowStyle {
    /**
     * The `shadow` of this item, merged over the `shadow` that it would cast. Setting it without `enabled` turns it on.
     *
     * A series casts up to 16 distinct `shadow` and `glow` values between them from its `itemStyler`. Past that, an item casts the `shadow` that it would cast without one, and a warning is logged once.
     */
    shadow?: Omit<AgDropShadowOptions, 'color'>;
    /**
     * The `glow` of this item, merged over the `glow` that it would cast. Setting it without `enabled` turns it on.
     *
     * A series casts up to 16 distinct `shadow` and `glow` values between them from its `itemStyler`. Past that, an item casts the `glow` that it would cast without one, and a warning is logged once.
     */
    glow?: AgGlowOptions;
}

/** What an `itemStyler` is given of the `shadow` and `glow` that its item casts, for the highlight state of the call. */
export interface AgItemShadowStylerParams {
    /**
     * The `shadow` that this item would cast, which the `shadow` an `itemStyler` returns is merged over. Unset if nothing sets it.
     * It has no deprecated `color`, so it can be returned, or spread into the `shadow` that is returned.
     */
    readonly shadow?: Readonly<Omit<AgDropShadowOptions, 'color'>>;
    /** The `glow` that this item would cast, which the `glow` an `itemStyler` returns is merged over. Unset if nothing sets it. */
    readonly glow?: Readonly<AgGlowOptions>;
}
