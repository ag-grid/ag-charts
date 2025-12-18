// ============================================================================
// Cartesian Series Utility Functions
// ============================================================================
// Standalone utility functions for the createNodeData() pattern.
// These can be shared across CartesianSeries subclasses and potentially with
// Polar/Hierarchy series that need similar patterns.

/**
 * Context type constraint for upsertNodeDatum.
 * The context must have incremental update tracking fields.
 */
export interface IncrementalUpdateContext<TDatum> {
    canIncrementallyUpdate: boolean;
    nodes: TDatum[];
    nodeIndex: number;
}

/**
 * Generic upsert pattern for node datum arrays.
 *
 * Reuses existing nodes when possible (incremental updates), creates new ones when needed.
 * This centralizes the common create-vs-update decision logic used across series.
 *
 * @example
 * ```typescript
 * for (let i = start; i < end; i++) {
 *     upsertNodeDatum(
 *         ctx,
 *         params,
 *         (ctx, params) => this.createNodeDatum(ctx, params),
 *         (ctx, node, params) => this.updateNodeDatum(ctx, node, params)
 *     );
 * }
 * ```
 *
 * @param ctx - Context with canIncrementallyUpdate, nodes, and nodeIndex
 * @param params - Parameters for creating/updating the node
 * @param createNode - Factory function to create a new node (returns undefined to skip)
 * @param updateNode - Function to update an existing node in-place
 * @returns The created or updated node, or undefined if skipped
 */
export function upsertNodeDatum<TContext extends IncrementalUpdateContext<TDatum>, TDatum, TParams>(
    ctx: TContext,
    params: TParams,
    createNode: (ctx: TContext, params: TParams) => TDatum | undefined,
    updateNode: (ctx: TContext, node: TDatum, params: TParams) => void
): TDatum | undefined {
    const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

    let node: TDatum | undefined;

    if (canReuseNode) {
        // Reuse existing node - update in place
        node = ctx.nodes[ctx.nodeIndex];
        updateNode(ctx, node, params);
    } else {
        // Create new node
        node = createNode(ctx, params);
        if (node != null) {
            ctx.nodes.push(node);
        }
    }

    ctx.nodeIndex++;
    return node;
}

/**
 * Checks if coordinate values are valid for rendering.
 *
 * A coordinate is invalid if it's NaN or Infinity.
 * Use this to skip processing invalid data points.
 *
 * @example
 * ```typescript
 * if (!isValidCoordinate(x, y)) continue;
 * ```
 */
export function isValidCoordinate(x: number, y: number): boolean {
    return Number.isFinite(x) && Number.isFinite(y);
}

/**
 * Trims an array to a specified length if it's longer.
 *
 * Use after incremental updates to remove excess nodes from previous render.
 *
 * @example
 * ```typescript
 * if (ctx.canIncrementallyUpdate) {
 *     trimArray(ctx.nodes, ctx.nodeIndex);
 * }
 * ```
 */
export function trimArray<T>(array: T[], length: number): void {
    if (length < array.length) {
        array.length = length;
    }
}

/**
 * Update coordinate fields in-place on a node datum.
 *
 * JIT-safe: modifies existing properties only, never adds new ones.
 * Centralizes the common x/y/midPoint coordinate calculation pattern.
 *
 * @example
 * ```typescript
 * updateNodeDatumCoordinates(datum, x, y, width, height);
 * ```
 *
 * @param datum - Node datum with x, y, and midPoint fields
 * @param x - Left edge x coordinate
 * @param y - Top edge y coordinate
 * @param width - Width for midPoint calculation
 * @param height - Height for midPoint calculation
 */
export function updateNodeDatumCoordinates(
    datum: { x: number; y: number; midPoint: { x: number; y: number } },
    x: number,
    y: number,
    width: number,
    height: number
): void {
    datum.x = x;
    datum.y = y;
    datum.midPoint.x = x + width / 2;
    datum.midPoint.y = y + height / 2;
}

/**
 * Update BBox fields in-place.
 *
 * JIT-safe: modifies existing properties only, never creates new objects.
 * Use this instead of creating new BBox instances in hot paths.
 *
 * @example
 * ```typescript
 * if (datum.clipBBox) {
 *     updateBBoxInPlace(datum.clipBBox, x, y, width, height);
 * }
 * ```
 *
 * @param bbox - Existing BBox to update
 * @param x - Left edge x coordinate
 * @param y - Top edge y coordinate
 * @param width - BBox width
 * @param height - BBox height
 */
export function updateBBoxInPlace(
    bbox: { x: number; y: number; width: number; height: number },
    x: number,
    y: number,
    width: number,
    height: number
): void {
    bbox.x = x;
    bbox.y = y;
    bbox.width = width;
    bbox.height = height;
}
