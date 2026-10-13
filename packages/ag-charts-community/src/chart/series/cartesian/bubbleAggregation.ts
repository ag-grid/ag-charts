import type { DomainWithMetadata, ScaleType } from 'ag-charts-core';
import {
    aggregationDomain,
    aggregationXRatioForXValue,
    areaSizeAtRatio,
    clamp,
    epochColumnForTimeScale,
    narrowAggregationX,
    narrowBigIntColumn,
} from 'ag-charts-core';
import type { AgMarkerSizeMode } from 'ag-charts-types';

const SIZE_QUANTIZATION = 3;
const FILTER_DATUM_THRESHOLD = 5;
const FILTER_RANGE_THRESHOLD = 0.05;

// CORE LAYER: Pure, testable aggregation functions

export interface BubbleAggregation {
    xValues: any[];
    yValues: any[];
    xd0: number;
    xd1: number;
    yd0: number;
    yd1: number;
    filters: BubbleAggregationFilter[];
    xNeedsValueOf: boolean;
    yNeedsValueOf: boolean;
    /**
     * Datum indices of every node, partitioned in place by the quadtree: a node's datums are
     * `indices[start, end)`. A parent's range holds its children's ranges back to back (quadrant by quadrant),
     * so only a leaf's range is in ascending datum order.
     */
    indices: Uint32Array;
}

export interface BubbleAggregationFilter {
    sizeRatio: number;
    node: BubbleAggregationNode | null;
}

export interface BubbleAggregationNode {
    scale: number;
    x0: any;
    y0: any;
    x1: any;
    y1: any;
    /** Inclusive start of this node's datums in {@link BubbleAggregation.indices}. */
    start: number;
    /** Exclusive end of this node's datums in {@link BubbleAggregation.indices}. */
    end: number;
    primaryDatumIndex: number;
    children: BubbleAggregationNode[] | null;
}

interface BubbleAggregationContext {
    xValues: any[];
    yValues: any[];
    xDomain: { min: number; max: number };
    yDomain: { min: number; max: number };
    xNeedsValueOf: boolean;
    yNeedsValueOf: boolean;
}

/**
 * Working buffers for building the quadtree, so that partitioning a node allocates nothing per call:
 * `scratch` and `codes` are indexed like `order`; `quadrants` holds, per tree depth, the bounds and count of each of
 * the four child quadrants (a node's children are built after it, one level deeper, so each level needs its own slot).
 */
interface BubbleBuildContext extends BubbleAggregationContext {
    order: Uint32Array;
    scratch: Uint32Array;
    codes: Uint8Array;
    quadrants: Float64Array;
    cursors: Uint32Array;
}

// Per quadrant: x0, y0, x1, y1 of the datums in it, then how many there are.
const QUADRANT_STRIDE = 5;
const QUADRANT_COUNT = 4;
const DEPTH_STRIDE = QUADRANT_COUNT * QUADRANT_STRIDE;
const INITIAL_DEPTH_CAPACITY = 32;

interface QuadBounds {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

function getPrimaryDatumIndex(
    context: BubbleAggregationContext,
    order: Uint32Array,
    start: number,
    end: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number
): number {
    const { xValues, yValues, xDomain, yDomain, xNeedsValueOf, yNeedsValueOf } = context;

    let currentIndex = 0;
    let currentDistanceSquared = Infinity;
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    for (let i = start; i < end; i += 1) {
        const datumIndex = order[i];
        const xValue = xValues[datumIndex];
        const yValue = yValues[datumIndex];
        if (xValue == null || yValue == null) continue;
        const xRatio = aggregationXRatioForXValue(xValue, xDomain.min, xDomain.max, xNeedsValueOf);
        const yRatio = aggregationXRatioForXValue(yValue, yDomain.min, yDomain.max, yNeedsValueOf);

        // A non-leaf range is no longer in datum order, so break distance ties towards the lowest datum index.
        const distanceSquared = (xRatio - midX) ** 2 + (yRatio - midY) ** 2;
        if (
            distanceSquared < currentDistanceSquared ||
            (distanceSquared === currentDistanceSquared && datumIndex < currentIndex)
        ) {
            currentDistanceSquared = distanceSquared;
            currentIndex = datumIndex;
        }
    }
    return currentIndex;
}

function countVisibleItems(
    context: BubbleAggregationContext,
    order: Uint32Array,
    start: number,
    end: number,
    bounds: QuadBounds
) {
    const { xValues, yValues, xDomain, yDomain, xNeedsValueOf, yNeedsValueOf } = context;
    const { x0, y0, x1, y1 } = bounds;

    let count = 0;
    for (let i = start; i < end; i += 1) {
        const datumIndex = order[i];
        const xValue = xValues[datumIndex];
        const yValue = yValues[datumIndex];
        if (xValue == null || yValue == null) continue;
        const xRatio = aggregationXRatioForXValue(xValue, xDomain.min, xDomain.max, xNeedsValueOf);
        const yRatio = aggregationXRatioForXValue(yValue, yDomain.min, yDomain.max, yNeedsValueOf);

        if (xRatio >= x0 && xRatio <= x1 && yRatio >= y0 && yRatio <= y1) {
            count += 1;
        }
    }

    return count;
}

const NULL_QUADRANT = QUADRANT_COUNT;

/**
 * Partitions `context.order[start, end)` into its four quadrants in place (stable, so each quadrant stays in
 * datum order), with datums that have a null x/y value moved to the tail, and builds a node per non-empty quadrant.
 * The range keeps exactly the datums it started with.
 *
 * `pending` says the range's datums are still in `scratch` (where the parent partitioned them) rather than `order`.
 * Reading them to bucket them copies them across, so a partition is written once and copied back lazily.
 */
function quadChildren(
    context: BubbleBuildContext,
    start: number,
    end: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    depth: number,
    pending: boolean
): BubbleAggregationNode[] {
    const { order, scratch, codes, cursors, xValues, yValues, xDomain, yDomain, xNeedsValueOf, yNeedsValueOf } =
        context;

    const base = depth * DEPTH_STRIDE;
    if (context.quadrants.length < base + DEPTH_STRIDE) {
        const grown = new Float64Array(Math.max(context.quadrants.length * 2, base + DEPTH_STRIDE));
        grown.set(context.quadrants);
        context.quadrants = grown;
    }
    const { quadrants } = context;

    // The bounds and count of each quadrant are accumulated in locals: this loop runs once per datum per level.
    let ax0 = 1,
        ay0 = 1,
        ax1 = 0,
        ay1 = 0,
        an = 0;
    let bx0 = 1,
        by0 = 1,
        bx1 = 0,
        by1 = 0,
        bn = 0;
    let cx0 = 1,
        cy0 = 1,
        cx1 = 0,
        cy1 = 0,
        cn = 0;
    let dx0 = 1,
        dy0 = 1,
        dx1 = 0,
        dy1 = 0,
        dn = 0;
    const source = pending ? scratch : order;
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    for (let i = start; i < end; i += 1) {
        const datumIndex = source[i];
        if (pending) order[i] = datumIndex;
        const xValue = xValues[datumIndex];
        const yValue = yValues[datumIndex];
        if (xValue == null || yValue == null) {
            codes[i] = NULL_QUADRANT;
            continue;
        }
        const xRatio = aggregationXRatioForXValue(xValue, xDomain.min, xDomain.max, xNeedsValueOf);
        const yRatio = aggregationXRatioForXValue(yValue, yDomain.min, yDomain.max, yNeedsValueOf);

        const quadrant = (xRatio > midX ? 1 : 0) + (yRatio > midY ? 2 : 0);
        codes[i] = quadrant;
        // Math.min/max rather than comparisons, so a NaN ratio poisons the bounds as it always has.
        if (quadrant === 0) {
            ax0 = Math.min(ax0, xRatio);
            ay0 = Math.min(ay0, yRatio);
            ax1 = Math.max(ax1, xRatio);
            ay1 = Math.max(ay1, yRatio);
            an += 1;
        } else if (quadrant === 1) {
            bx0 = Math.min(bx0, xRatio);
            by0 = Math.min(by0, yRatio);
            bx1 = Math.max(bx1, xRatio);
            by1 = Math.max(by1, yRatio);
            bn += 1;
        } else if (quadrant === 2) {
            cx0 = Math.min(cx0, xRatio);
            cy0 = Math.min(cy0, yRatio);
            cx1 = Math.max(cx1, xRatio);
            cy1 = Math.max(cy1, yRatio);
            cn += 1;
        } else {
            dx0 = Math.min(dx0, xRatio);
            dy0 = Math.min(dy0, yRatio);
            dx1 = Math.max(dx1, xRatio);
            dy1 = Math.max(dy1, yRatio);
            dn += 1;
        }
    }
    quadrants[base + 0] = ax0;
    quadrants[base + 1] = ay0;
    quadrants[base + 2] = ax1;
    quadrants[base + 3] = ay1;
    quadrants[base + 4] = an;
    quadrants[base + 5] = bx0;
    quadrants[base + 6] = by0;
    quadrants[base + 7] = bx1;
    quadrants[base + 8] = by1;
    quadrants[base + 9] = bn;
    quadrants[base + 10] = cx0;
    quadrants[base + 11] = cy0;
    quadrants[base + 12] = cx1;
    quadrants[base + 13] = cy1;
    quadrants[base + 14] = cn;
    quadrants[base + 15] = dx0;
    quadrants[base + 16] = dy0;
    quadrants[base + 17] = dx1;
    quadrants[base + 18] = dy1;
    quadrants[base + 19] = dn;

    let offset = start;
    let inOneQuadrant = false;
    for (let quadrant = 0; quadrant < QUADRANT_COUNT; quadrant += 1) {
        const count = quadrants[base + quadrant * QUADRANT_STRIDE + 4];
        cursors[quadrant] = offset;
        offset += count;
        inOneQuadrant ||= count === end - start;
    }
    cursors[NULL_QUADRANT] = offset;
    // When everything falls in one quadrant (and none is null) the datums are already where they belong.
    if (!inOneQuadrant) {
        for (let i = start; i < end; i += 1) {
            scratch[cursors[codes[i]]++] = order[i];
        }
        // Nothing builds a node from the null tail, so it is the one part that is not copied back lazily.
        for (let i = offset; i < end; i += 1) {
            order[i] = scratch[i];
        }
    }

    // Building a child may grow `context.quadrants`, so read each quadrant's slot from the context.
    const children: BubbleAggregationNode[] = [];
    let childStart = start;
    for (let quadrant = 0; quadrant < QUADRANT_COUNT; quadrant += 1) {
        const q = base + quadrant * QUADRANT_STRIDE;
        const count = context.quadrants[q + 4];
        if (count === 0) continue;

        const { quadrants: slots } = context;
        const child = aggregateQuad(
            context,
            childStart,
            childStart + count,
            slots[q],
            slots[q + 1],
            slots[q + 2],
            slots[q + 3],
            depth + 1,
            !inOneQuadrant
        );
        children.push(child);
        childStart += count;
    }

    return children;
}

/**
 * A zero-width domain makes every ratio NaN, so no quad can be partitioned or terminated on and the
 * recursion never bottoms out. Widening it keeps every ratio finite and collapses the axis instead.
 */
function ratioDomain(d0: number, d1: number): [number, number] {
    if (Number.isFinite(d0) && Number.isFinite(d1) && d1 > d0) return [d0, d1];
    const min = Number.isFinite(d0) ? d0 : 0;
    return [min, min + 1];
}

function aggregateQuad(
    context: BubbleBuildContext,
    start: number,
    end: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    depth: number,
    pending: boolean
): BubbleAggregationNode {
    const terminate =
        !Number.isFinite(x1 - x0) ||
        !Number.isFinite(y1 - y0) ||
        (end - start < FILTER_DATUM_THRESHOLD &&
            x1 - x0 < FILTER_RANGE_THRESHOLD &&
            y1 - y0 < FILTER_RANGE_THRESHOLD) ||
        (x0 === x1 && y0 === y1);

    let children: BubbleAggregationNode[] | null = null;
    if (terminate) {
        if (pending) {
            const { order, scratch } = context;
            for (let i = start; i < end; i += 1) {
                order[i] = scratch[i];
            }
        }
    } else {
        children = quadChildren(context, start, end, x0, y0, x1, y1, depth, pending);
    }

    if (children?.length === 1) {
        // Flatten the tree if there's only one child
        return children[0];
    } else if (children?.length === 0) {
        children = null;
    }

    const scale = Math.hypot(x1 - x0, y1 - y0);
    const primaryDatumIndex = getPrimaryDatumIndex(context, context.order, start, end, x0, y0, x1, y1);
    return { scale, x0, y0, x1, y1, start, end, primaryDatumIndex, children };
}

/**
 * Computes quadtree-based spatial aggregation for bubble chart data.
 *
 * Creates a hierarchical quadtree structure to efficiently render large bubble
 * datasets by grouping spatially-close bubbles. Unlike linear series aggregation,
 * this uses 2D spatial partitioning with optional size-based quantization.
 *
 * @param xDomain - X domain bounds [min, max]
 * @param yDomain - Y domain bounds [min, max]
 * @param xValues - X coordinate values
 * @param yValues - Y coordinate values
 * @param sizeValues - Bubble size values (optional)
 * @param sizeDomain - Size domain [min, max]
 * @param options - Configuration options
 * @param options.xNeedsValueOf - Whether X values need valueOf() conversion
 * @param options.yNeedsValueOf - Whether Y values need valueOf() conversion
 * @returns Bubble aggregation with quadtree nodes, or undefined if no aggregation possible
 *
 * @complexity O(n log n) for quadtree construction where n is data points
 * @memory Creates hierarchical node structure proportional to spatial distribution
 *
 * @example
 * const aggregation = computeBubbleAggregation(
 *   [0, 100], [0, 100],
 *   xData, yData, sizeData,
 *   [10, 50],
 *   { xNeedsValueOf: false, yNeedsValueOf: false }
 * );
 * // Returns quadtree with spatially-grouped bubble indices
 */
export function computeBubbleAggregation(
    xDomain: [number, number],
    yDomain: [number, number],
    xValues: any[],
    yValues: any[],
    sizeValues: any[] | undefined,
    sizeDomain: [number, number],
    options: {
        xNeedsValueOf: boolean;
        yNeedsValueOf: boolean;
    }
): BubbleAggregation | undefined {
    const [xd0, xd1] = ratioDomain(...xDomain);
    const [yd0, yd1] = ratioDomain(...yDomain);
    const [sd0, sd1] = sizeDomain;
    const { xNeedsValueOf, yNeedsValueOf } = options;

    // Every node's datums live in this one buffer, which `aggregateQuad` partitions in place, quadrant by quadrant.
    // The size buckets are laid out back to back, each in datum order.
    let order: Uint32Array;
    const bucketEnds: number[] = [];
    const quantised = sizeValues != null && sd1 > sd0;
    if (quantised) {
        const bucketOf = (datumIndex: number) => {
            const sizeRatio = (sizeValues[datumIndex] - sd0) / (sd1 - sd0);
            const sizeIndex = Math.trunc(sizeRatio * SIZE_QUANTIZATION);
            return sizeIndex >= 0 && sizeIndex < SIZE_QUANTIZATION ? sizeIndex : -1;
        };

        const cursors: number[] = Array.from({ length: SIZE_QUANTIZATION }, () => 0);
        for (let datumIndex = 0; datumIndex < sizeValues.length; datumIndex += 1) {
            const sizeIndex = bucketOf(datumIndex);
            if (sizeIndex !== -1) cursors[sizeIndex] += 1;
        }

        let total = 0;
        for (let i = 0; i < SIZE_QUANTIZATION; i += 1) {
            const count = cursors[i];
            cursors[i] = total;
            total += count;
            bucketEnds.push(total);
        }

        order = new Uint32Array(total);
        for (let datumIndex = 0; datumIndex < sizeValues.length; datumIndex += 1) {
            const sizeIndex = bucketOf(datumIndex);
            if (sizeIndex !== -1) order[cursors[sizeIndex]++] = datumIndex;
        }
    } else {
        order = new Uint32Array(xValues.length);
        for (let datumIndex = 0; datumIndex < order.length; datumIndex += 1) {
            order[datumIndex] = datumIndex;
        }
        bucketEnds.push(order.length);
    }

    const context: BubbleBuildContext = {
        xValues,
        yValues,
        xDomain: { min: xd0, max: xd1 },
        yDomain: { min: yd0, max: yd1 },
        xNeedsValueOf,
        yNeedsValueOf,
        order,
        scratch: new Uint32Array(order.length),
        codes: new Uint8Array(order.length),
        quadrants: new Float64Array(INITIAL_DEPTH_CAPACITY * DEPTH_STRIDE),
        cursors: new Uint32Array(QUADRANT_COUNT + 1),
    };

    const filters: BubbleAggregationFilter[] = [];
    let start = 0;
    for (let i = 0; i < bucketEnds.length; i += 1) {
        const end = bucketEnds[i];
        const node = aggregateQuad(context, start, end, 0, 0, 1, 1, 0, false);
        start = end;

        if (node != null) {
            filters.push({ sizeRatio: quantised ? i / SIZE_QUANTIZATION : 0, node });
        }
    }

    return filters.length > 0
        ? { xValues, yValues, xd0, xd1, yd0, yd1, filters, xNeedsValueOf, yNeedsValueOf, indices: order }
        : undefined;
}

// ADAPTER LAYER: Scale integration

/**
 * Aggregates bubble data for rendering optimization (low-level adapter).
 * Extracts domains from scales and delegates to core aggregation function.
 *
 * Note: No memoization layer - bubble aggregation is not used in mini charts
 * where performance would be critical.
 *
 * @internal
 */
function aggregateBubbleData(
    yScale: ScaleType,
    xValues: any[],
    yValues: any[],
    sizeValues: any[] | undefined,
    xDomain: [number, number],
    yDomainInput: DomainWithMetadata<any>,
    sizeDomain: number[],
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): BubbleAggregation | undefined {
    const [xd0, xd1] = xDomain;
    const [yd0, yd1] = aggregationDomain(yScale, yDomainInput);
    return computeBubbleAggregation(
        [xd0, xd1],
        [yd0, yd1],
        xValues,
        yValues,
        sizeValues,
        [sizeDomain[0], sizeDomain[1]],
        { xNeedsValueOf, yNeedsValueOf }
    );
}

// INTEGRATION LAYER: DataModel

/**
 * High-level aggregation function for series integration.
 * Handles data extraction from DataModel and delegates to aggregation.
 *
 * @param xScale - The X-axis scale type
 * @param yScale - The Y-axis scale type
 * @param dataModel - Data model containing the processed data
 * @param processedData - Processed data to aggregate
 * @param sizeScale - Size scale for bubble sizing
 * @param hasSizeKey - Whether size key is defined
 * @param series - Series context for data model queries
 * @returns Bubble aggregation or undefined if aggregation not needed
 */
export function aggregateBubbleDataFromDataModel(
    xScale: ScaleType,
    yScale: ScaleType,
    dataModel: any,
    processedData: any,
    sizeScale: any,
    hasSizeKey: boolean,
    series: any
): BubbleAggregation | undefined {
    const rawXValues = dataModel.resolveColumnById(series, 'xValue', processedData, 'object');
    const rawYValues = dataModel.resolveColumnById(series, 'yValue', processedData, 'mixed-numeric');
    // Narrow the size column like x/y: the quantisation ratio mixes it with the Number-narrowed size domain.
    const sizeValues = hasSizeKey
        ? narrowBigIntColumn(dataModel.resolveColumnById(series, 'sizeValue', processedData, 'mixed-numeric'))
        : undefined;

    const xDomain = dataModel.getDomain(series, 'xValue', 'value', processedData);
    const yDomain = dataModel.getDomain(series, 'yValue', 'value', processedData);
    const sizeDomain = hasSizeKey ? sizeScale.domain : [0, 0];

    const rawXNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'yValue', processedData);

    // Parse ISO time x to epoch ms first, then subtract the bigint domain-min from x and [xd0,xd1] together so a
    // high-magnitude narrow-range x keeps full quadtree precision; non-bigint columns narrow absolutely.
    const { values: epochXValues, needsValueOf: xNeedsValueOf } = epochColumnForTimeScale(
        xScale,
        rawXValues,
        rawXNeedsValueOf
    );
    const { xValues, domain: xNumericDomain } = narrowAggregationX(xScale, epochXValues, xDomain);
    const yValues = yNeedsValueOf ? rawYValues : narrowBigIntColumn(rawYValues);

    return aggregateBubbleData(
        yScale,
        xValues,
        yValues,
        sizeValues,
        xNumericDomain,
        yDomain,
        sizeDomain,
        xNeedsValueOf,
        yNeedsValueOf
    );
}

export interface BubbleAggregationOptions {
    xRange: number;
    yRange: number;
    xVisibleRange: [number, number];
    yVisibleRange: [number, number];
    minSize: number;
    maxSize: number;
    /** When `'area'`, marker area (not diameter) is linear in the size ratio. */
    sizeMode?: AgMarkerSizeMode;
}

export interface GroupedAggregation {
    datumIndex: number;
    count: number;
    area: number;
    dilation: number;
    /** The node's datum indices: a view of {@link BubbleAggregation.indices}, grouped by quadrant. */
    indices: Uint32Array;
}

function computeBubbleAggregationCountIndices(
    dilation: number,
    dataAggregation: BubbleAggregation,
    options: BubbleAggregationOptions,
    counter: { count: number } | undefined,
    groupedAggregation: GroupedAggregation[] | undefined,
    singleDatumIndices: number[] | undefined
) {
    const {
        xRange,
        yRange,
        xVisibleRange: [xvr0, xvr1],
        yVisibleRange: [yvr0, yvr1],
        minSize,
        maxSize,
        sizeMode,
    } = options;
    const { xValues, yValues, xd0, xd1, yd0, yd1, xNeedsValueOf, yNeedsValueOf, indices: order } = dataAggregation;
    const baseScalingFactor = 1 / Math.min(xRange / (xvr1 - xvr0), yRange / (yvr1 - yvr0));

    const context: BubbleAggregationContext = {
        xValues,
        yValues,
        xDomain: { min: xd0, max: xd1 },
        yDomain: { min: yd0, max: yd1 },
        xNeedsValueOf,
        yNeedsValueOf,
    };

    for (const { sizeRatio, node } of dataAggregation.filters) {
        const diameter =
            sizeMode === 'area'
                ? areaSizeAtRatio(sizeRatio, minSize, maxSize)
                : minSize + sizeRatio * (maxSize - minSize);
        const radius = 0.5 * diameter;
        const baseMinScale = radius * baseScalingFactor;
        const minScale = dilation * baseMinScale;
        const x0 = xvr0 - radius / xRange;
        const x1 = xvr1 + radius / xRange;
        const y0 = yvr0 - radius / yRange;
        const y1 = yvr1 + radius / yRange;

        const queue = [node];
        while (queue.length > 0) {
            const item = queue.pop()!;

            if (item.x1 < x0 || item.x0 > x1 || item.y1 < y0 || item.y0 > y1) {
                continue;
            }

            if (dilation !== 1 && item.scale <= minScale) {
                if (counter != null) {
                    counter.count += 1;
                }
                groupedAggregation?.push({
                    datumIndex: item.primaryDatumIndex,
                    count: item.end - item.start,
                    area: (item.x1 - item.x0) * (item.y1 - item.y0),
                    dilation: clamp(1, item.scale / baseMinScale, dilation),
                    indices: order.subarray(item.start, item.end),
                });
            } else if (item.children == null) {
                const { start, end } = item;
                if (counter != null) {
                    const fullyVisible = item.x0 >= xvr0 && item.x1 <= xvr1 && item.y0 >= yvr0 && item.y1 <= yvr1;
                    const itemCount = fullyVisible
                        ? end - start
                        : countVisibleItems(context, order, start, end, { x0: xvr0, y0: yvr0, x1: xvr1, y1: yvr1 });
                    counter.count += itemCount;
                }
                if (singleDatumIndices != null) {
                    for (let i = start; i < end; i += 1) {
                        singleDatumIndices.push(order[i]);
                    }
                }
            } else {
                queue.push(...item.children);
            }
        }
    }
}

export function computeBubbleAggregationCount(
    dilation: number,
    dataAggregation: BubbleAggregation,
    options: BubbleAggregationOptions
) {
    const counter = { count: 0 };
    computeBubbleAggregationCountIndices(dilation, dataAggregation, options, counter, undefined, undefined);
    return counter.count;
}

const MAX_AGGREGATION_DILATION = 100;
const DILATION_ITERATIONS = 12; // Higher precision here reduces flickering when zooming in and out

export function computeBubbleAggregationDilation(
    dataAggregation: BubbleAggregation,
    aggregationOptions: BubbleAggregationOptions,
    maxRenderedItems: number
) {
    if (computeBubbleAggregationCount(1, dataAggregation, aggregationOptions) <= maxRenderedItems) {
        return 1;
    }

    let minDilation = 1;
    let maxDilation = 2;
    while (
        computeBubbleAggregationCount(maxDilation, dataAggregation, aggregationOptions) > maxRenderedItems &&
        maxDilation < MAX_AGGREGATION_DILATION
    ) {
        minDilation *= 2;
        maxDilation *= 2;
    }

    for (let i = 0; i < DILATION_ITERATIONS; i += 1) {
        const dilation = (maxDilation + minDilation) / 2;
        const count = computeBubbleAggregationCount(dilation, dataAggregation, aggregationOptions);

        if (count > maxRenderedItems) {
            minDilation = dilation;
        } else {
            maxDilation = dilation;
        }
    }

    return (minDilation + maxDilation) / 2;
}

export function computeBubbleAggregationData(
    dilation: number,
    dataAggregation: BubbleAggregation,
    options: BubbleAggregationOptions
) {
    const groupedAggregation: GroupedAggregation[] = [];
    const singleDatumIndices: number[] = [];
    computeBubbleAggregationCountIndices(
        dilation,
        dataAggregation,
        options,
        undefined,
        groupedAggregation,
        singleDatumIndices
    );
    return { groupedAggregation, singleDatumIndices };
}
