/**
 * Which part of a layer shadow batch is being drawn. See {@link renderChildrenWithShadowBatches}.
 *
 * - `none`: nodes cast their own shadows.
 * - `mask`: casters draw their silhouettes, with their real paint, into the batch's scratch canvas.
 * - `suppress`: casters draw as usual but cast no shadow, because the batch cast it beneath them.
 */
export type ShadowPassState = 'none' | 'mask' | 'suppress';

/** Module state rather than render context, because `Shape.fillStroke()` has no access to the render context. */
export const shadowPass: { state: ShadowPassState } = { state: 'none' };
