/**
 * Which part of a layer shadow batch is being drawn. See {@link renderChildrenWithShadowBatches}.
 *
 * - `none`: nodes cast their own shadows.
 * - `mask`: casters draw their silhouettes, with their real paint, into the batch's scratch canvas. With a `spread`, or
 *   when tinted, they draw them solid.
 * - `suppress`: casters draw as usual but cast no shadow, because the batch cast it beneath them.
 */
export type ShadowPassState = 'none' | 'mask' | 'suppress';

/**
 * Which of a shape's two cast slots a pass draws: its `shadow` ({@link Shape.fillShadow}) or its `glow`
 * ({@link Shape.fillGlow}). A shape may cast both, so a key of a batch casts one slot of its casters.
 */
export type ShadowSlot = 'shadow' | 'glow';

/** Module state rather than render context, because `Shape.fillStroke()` has no access to the render context. */
export const shadowPass: {
    state: ShadowPassState;
    /** During a `mask` pass, the slot of the casters that the batch casts. */
    slot: ShadowSlot;
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
    /**
     * During a `mask` pass that erases the footprint of a glow's `gap`, how far the footprints are dilated, in pixels. Casters
     * then draw the geometry of the item, whatever its paint, and the pass erases it from the glow that was blurred.
     */
    erase: number | undefined;
    /** During a pass that erases footprints, whether an item with no fill has the footprint of its stroke alone. */
    erasePainted: boolean;
    /** During a pass that erases footprints, how they are drawn: `destination-out` onto a glow, or solid onto a canvas to cut it. */
    eraseOp: GlobalCompositeOperation;
} = {
    state: 'none',
    slot: 'shadow',
    opaque: false,
    tinted: false,
    resolution: { x: 1, y: 1 },
    erase: undefined,
    erasePainted: false,
    eraseOp: 'destination-out',
};

/** How far a shadow's silhouette is dilated: its `spread`, moved outwards by its glow's `gap`, which is then cut out. */
export function getShadowSpread(shadow: { spread?: number; gap?: number }): number {
    return (shadow.spread ?? 0) + (shadow.gap ?? 0);
}

/**
 * Whether the silhouette is drawn dilated, as a copy of the item's geometry. A set `gap` does so even at `0`, as the item
 * is then cast at its own strength, whatever its paint, and its footprint cut out of that.
 */
export function dilatesShadow(shadow: { spread?: number; gap?: number }): boolean {
    return shadow.gap != null || (shadow.spread ?? 0) > 0;
}
