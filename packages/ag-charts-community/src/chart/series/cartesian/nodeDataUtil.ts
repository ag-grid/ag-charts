/**
 * Shared utility functions for node datum context creation and node data management.
 * These functions extract common patterns from createNodeDatumContext() and createNodeData()
 * across cartesian series implementations.
 */

/**
 * Computes the absolute range from a scale's range array.
 * Used by all series to determine the pixel range for aggregation calculations.
 */
export function computeScaleRange(scale: { range: number[] }): number {
    const [r0, r1] = scale.range;
    return Math.abs(r1 - r0);
}

/**
 * Computes the bandwidth offset (half of bandwidth, or 0 if no bandwidth).
 * Used by line-like series (Line, Area, RangeArea) to center points on categorical axes.
 */
export function computeBandwidthOffset(scale: { bandwidth?: number }): number {
    return (scale.bandwidth ?? 0) / 2;
}

/**
 * Resolves the state for incremental node updates.
 * Returns whether incremental updates are possible and the existing nodes array to reuse.
 */
export function resolveIncrementalUpdateState<T>(
    changeDescription: unknown,
    existingNodeData: T[] | undefined
): { canIncrementallyUpdate: boolean; nodes: T[] } {
    const canIncrementallyUpdate = changeDescription != null && existingNodeData != null;
    return {
        canIncrementallyUpdate,
        nodes: canIncrementallyUpdate ? existingNodeData : [],
    };
}

/** Threshold below which aggregation is bypassed and all data is iterated. */
const AGGREGATION_BYPASS_THRESHOLD = 1e3;

/**
 * Computes the visible range with optional bypass for small datasets.
 * AG-13575: For small datasets, iterating all data is faster than visible range filtering.
 *
 * @param visibleRange - The [start, end] indices from visibleRangeIndices()
 * @param totalCount - Total number of data points
 * @param padding - Optional padding to add before start and after end (default: 0)
 * @returns The [start, end] range to iterate
 */
export function computeVisibleRangeWithBypass(
    visibleRange: [number, number],
    totalCount: number,
    padding: number = 0
): [number, number] {
    // AG-13575: For small datasets, iterate all data
    if (totalCount < AGGREGATION_BYPASS_THRESHOLD) {
        return [0, totalCount];
    }

    let [start, end] = visibleRange;

    // Apply padding for rendering continuity at edges
    start = Math.max(start - padding, 0);
    end = Math.min(end + padding, totalCount);

    return [start, end];
}

/**
 * Trims excess nodes when incremental updates produce fewer nodes than before.
 * Mutates the array by setting its length.
 */
export function trimIncrementalNodes<T>(canIncrementallyUpdate: boolean, nodes: T[], nodeIndex: number): void {
    if (canIncrementallyUpdate && nodeIndex < nodes.length) {
        nodes.length = nodeIndex;
    }
}

/**
 * Updates span points for path rendering in line-like series.
 * Handles point addition and break tracking for missing data.
 *
 * @param spanPoints - Array of spans (point arrays) or breaks ({ skip: number })
 * @param point - The point to add, or undefined/null for missing data
 * @param connectMissingData - If true, missing data doesn't create breaks
 */
export function updateSpanPoints<T>(
    spanPoints: Array<T[] | { skip: number }>,
    point: T | undefined | null,
    connectMissingData: boolean
): void {
    const currentSpan = spanPoints.at(-1);

    if (point != null) {
        if (Array.isArray(currentSpan)) {
            currentSpan.push(point);
        } else {
            spanPoints.push([point]);
        }
    } else if (!connectMissingData) {
        if (Array.isArray(currentSpan) || currentSpan == null) {
            spanPoints.push({ skip: 0 });
        } else {
            currentSpan.skip += 1;
        }
    }
}
