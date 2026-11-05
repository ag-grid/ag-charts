/**
 * Which part of a layer shadow batch is being drawn. See {@link renderChildrenWithShadowBatches}.
 *
 * - `none`: nodes cast their own shadows.
 * - `mask`: casters draw their silhouettes, with their real paint, into the batch's scratch canvas. With a `spread`, or
 *   when tinted, they draw them solid.
 * - `suppress`: casters draw as usual but cast no shadow, because the batch cast it beneath them.
 */
/** Which of a shape's two shadows a cast is of: `shadow` is the shape's `fillShadow`, `glow` its `fillGlow`. */
export type ShadowSlot = 'shadow' | 'glow';

export type ShadowPassState = 'none' | 'mask' | 'suppress';

/** Module state rather than render context, because `Shape.fillStroke()` has no access to the render context. */
export const shadowPass: {
    state: ShadowPassState;
    /**
     * During a `mask` pass, whether casters with a `spread` draw their silhouettes solid, whatever the strength of their
     * paint, because the batch casts its shadow at the one strength that all of its casters share.
     */
    opaque: boolean;
    /**
     * During a `mask` pass, whether casters draw their silhouettes in the colour that their shadow takes, rather than in one
     * colour, because the batch blurs the silhouettes of every colour once.
     */
    tinted: boolean;
    /**
     * During a `mask` pass, how many device pixels the scratch canvas has per pixel of the layer, along each axis. It is
     * below 1 for a layer too large to mask at full resolution, and 1 otherwise.
     */
    resolution: { x: number; y: number };
    /** Which of the shape's shadows the casters being drawn or keyed by the engine cast. */
    slot: ShadowSlot;
    /** During a `mask` pass that erases a glow's gap, how far the silhouettes are dilated, in place of the shadow's `spread`. */
    erase: number | undefined;
} = { state: 'none', opaque: false, tinted: false, resolution: { x: 1, y: 1 }, slot: 'shadow', erase: undefined };

/** How far a shadow's silhouette is dilated: its `spread`, moved outwards by its glow's `gap`, which is then cut out. */
export function getShadowSpread(shadow: { spread?: number; gap?: number }): number {
    return (shadow.spread ?? 0) + (shadow.gap ?? 0);
}
