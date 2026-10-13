/**
 * Which part of a layer shadow batch is being drawn. See {@link renderChildrenWithShadowBatches}.
 *
 * - `none`: nodes cast their own shadows.
 * - `mask`: casters draw their silhouettes, with their real paint, into the batch's scratch canvas.
 * - `suppress`: casters draw as usual but cast no shadow, because the batch cast it beneath them.
 */
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
     * During a `mask` pass, how many device pixels the scratch canvas has per pixel of the layer, along each axis. It is
     * below 1 for a layer too large to mask at full resolution, and 1 otherwise.
     */
    resolution: { x: number; y: number };
} = { state: 'none', opaque: false, resolution: { x: 1, y: 1 } };
