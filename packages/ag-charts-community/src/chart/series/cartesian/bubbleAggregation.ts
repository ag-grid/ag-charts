import type { ScaleType } from 'ag-charts-core';
import { clamp } from 'ag-charts-core';

import { aggregationDomain, aggregationXRatioForXValue } from '../aggregation';

const SIZE_QUANTIZATION = 3;
const FILTER_DATUM_THRESHOLD = 5;
const FILTER_RANGE_THRESHOLD = 0.05;

// ============================================================================
// CORE LAYER: Pure, testable aggregation functions
// ============================================================================

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
    indices: number[];
    primaryDatumIndex: number;
    children: BubbleAggregationNode[] | null;
}

interface ChildBucket {
    indices: number[];
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

interface BubbleAggregationContext {
    xValues: any[];
    yValues: any[];
    xDomain: { min: number; max: number };
    yDomain: { min: number; max: number };
    xNeedsValueOf: boolean;
    yNeedsValueOf: boolean;
}

interface QuadBounds {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

function getPrimaryDatumIndex(context: BubbleAggregationContext, indices: number[], bounds: QuadBounds): number {
    const { xValues, yValues, xDomain, yDomain, xNeedsValueOf, yNeedsValueOf } = context;
    const { x0, y0, x1, y1 } = bounds;

    let currentIndex = 0;
    let currentDistanceSquared = Infinity;
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    for (const datumIndex of indices) {
        const xValue = xValues[datumIndex];
        const yValue = yValues[datumIndex];
        if (xValue == null || yValue == null) continue;
        const xRatio = aggregationXRatioForXValue(xValue, xDomain.min, xDomain.max, xNeedsValueOf);
        const yRatio = aggregationXRatioForXValue(yValue, yDomain.min, yDomain.max, yNeedsValueOf);

        const distanceSquared = (xRatio - midX) ** 2 + (yRatio - midY) ** 2;
        if (distanceSquared < currentDistanceSquared) {
            currentDistanceSquared = distanceSquared;
            currentIndex = datumIndex;
        }
    }
    return currentIndex;
}

function countVisibleItems(context: BubbleAggregationContext, indices: number[], bounds: QuadBounds) {
    const { xValues, yValues, xDomain, yDomain, xNeedsValueOf, yNeedsValueOf } = context;
    const { x0, y0, x1, y1 } = bounds;

    let count = 0;
    for (const datumIndex of indices) {
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

function quadChildren(
    context: BubbleAggregationContext,
    indices: number[],
    bounds: QuadBounds
): BubbleAggregationNode[] {
    const { xValues, yValues, xDomain, yDomain, xNeedsValueOf, yNeedsValueOf } = context;
    const { x0, y0, x1, y1 } = bounds;

    const childBuckets: ChildBucket[] = [
        { x0: 1, y0: 1, x1: 0, y1: 0, indices: [] },
        { x0: 1, y0: 1, x1: 0, y1: 0, indices: [] },
        { x0: 1, y0: 1, x1: 0, y1: 0, indices: [] },
        { x0: 1, y0: 1, x1: 0, y1: 0, indices: [] },
    ];

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    for (const datumIndex of indices) {
        const xValue = xValues[datumIndex];
        const yValue = yValues[datumIndex];
        if (xValue == null || yValue == null) continue;
        const xRatio = aggregationXRatioForXValue(xValue, xDomain.min, xDomain.max, xNeedsValueOf);
        const yRatio = aggregationXRatioForXValue(yValue, yDomain.min, yDomain.max, yNeedsValueOf);

        const childIndex = (xRatio > midX ? 1 : 0) + (yRatio > midY ? 2 : 0);
        const childBucket = childBuckets[childIndex];
        childBucket.indices.push(datumIndex);
        childBucket.x0 = Math.min(childBucket.x0, xRatio);
        childBucket.y0 = Math.min(childBucket.y0, yRatio);
        childBucket.x1 = Math.max(childBucket.x1, xRatio);
        childBucket.y1 = Math.max(childBucket.y1, yRatio);
    }

    const children: BubbleAggregationNode[] = [];
    for (const childBucket of childBuckets) {
        const { indices: childIndices, x0: cx0, x1: cx1, y0: cy0, y1: cy1 } = childBucket;
        if (childIndices.length === 0) continue;

        const child = aggregateQuad(context, childIndices, { x0: cx0, y0: cy0, x1: cx1, y1: cy1 });
        children.push(child);
    }

    return children;
}

function aggregateQuad(
    context: BubbleAggregationContext,
    indices: number[],
    bounds: QuadBounds
): BubbleAggregationNode {
    const { x0, y0, x1, y1 } = bounds;

    const terminate =
        (indices.length < FILTER_DATUM_THRESHOLD &&
            x1 - x0 < FILTER_RANGE_THRESHOLD &&
            y1 - y0 < FILTER_RANGE_THRESHOLD) ||
        (x0 === x1 && y0 === y1);

    let children = terminate ? null : quadChildren(context, indices, bounds);

    if (children?.length === 1) {
        // Flatten the tree if there's only one child
        return children[0];
    } else if (children?.length === 0) {
        children = null;
    }

    const scale = Math.hypot(x1 - x0, y1 - y0);
    const primaryDatumIndex = getPrimaryDatumIndex(context, indices, bounds);
    return { scale, x0, y0, x1, y1, indices, primaryDatumIndex, children };
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
    const [xd0, xd1] = xDomain;
    const [yd0, yd1] = yDomain;
    const [sd0, sd1] = sizeDomain;
    const { xNeedsValueOf, yNeedsValueOf } = options;

    const context: BubbleAggregationContext = {
        xValues,
        yValues,
        xDomain: { min: xd0, max: xd1 },
        yDomain: { min: yd0, max: yd1 },
        xNeedsValueOf,
        yNeedsValueOf,
    };

    const filters: BubbleAggregationFilter[] = [];
    if (sizeValues != null && sd1 > sd0) {
        const sizeIndices = Array.from({ length: SIZE_QUANTIZATION }, (): number[] => []);
        for (let datumIndex = 0; datumIndex < sizeValues.length; datumIndex += 1) {
            const sizeValue = sizeValues[datumIndex];
            const sizeRatio = (sizeValue - sd0) / (sd1 - sd0);
            const sizeIndex = Math.trunc(sizeRatio * SIZE_QUANTIZATION);
            if (sizeIndex >= 0 && sizeIndex < SIZE_QUANTIZATION) {
                sizeIndices[sizeIndex].push(datumIndex);
            }
        }

        for (let i = 0; i < sizeIndices.length; i += 1) {
            const indices = sizeIndices[i];
            const node = aggregateQuad(context, indices, { x0: 0, y0: 0, x1: 1, y1: 1 });

            if (node != null) {
                const sizeRatio = i / SIZE_QUANTIZATION;
                filters.push({ sizeRatio, node });
            }
        }
    } else {
        const indices = xValues.map((_, i) => i);
        const node = aggregateQuad(context, indices, { x0: 0, y0: 0, x1: 1, y1: 1 });

        if (node != null) {
            filters.push({ sizeRatio: 0, node });
        }
    }

    return filters.length > 0
        ? { xValues, yValues, xd0, xd1, yd0, yd1, filters, xNeedsValueOf, yNeedsValueOf }
        : undefined;
}

// ============================================================================
// ADAPTER LAYER: Scale integration
// ============================================================================

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
    xScale: ScaleType,
    yScale: ScaleType,
    xValues: any[],
    yValues: any[],
    sizeValues: any[] | undefined,
    xDomain: any[],
    yDomain: any[],
    sizeDomain: number[],
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): BubbleAggregation | undefined {
    const [xd0, xd1] = aggregationDomain(xScale, xDomain);
    const [yd0, yd1] = aggregationDomain(yScale, yDomain);
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

// ============================================================================
// INTEGRATION LAYER: DataModel
// ============================================================================

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
    const xValues = dataModel.resolveColumnById(series, 'xValue', processedData);
    const yValues = dataModel.resolveColumnById(series, 'yValue', processedData);
    const sizeValues = hasSizeKey ? dataModel.resolveColumnById(series, 'sizeValue', processedData) : undefined;

    const xDomain = dataModel.getDomain(series, 'xValue', 'value', processedData);
    const yDomain = dataModel.getDomain(series, 'yValue', 'value', processedData);
    const sizeDomain = hasSizeKey ? sizeScale.domain : [0, 0];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'yValue', processedData);

    return aggregateBubbleData(
        xScale,
        yScale,
        xValues,
        yValues,
        sizeValues,
        xDomain,
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
}

export interface GroupedAggregation {
    datumIndex: number;
    count: number;
    area: number;
    dilation: number;
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
    } = options;
    const { xValues, yValues, xd0, xd1, yd0, yd1, xNeedsValueOf, yNeedsValueOf } = dataAggregation;
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
        const radius = 0.5 * (minSize + sizeRatio * (maxSize - minSize));
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
                    count: item.indices.length,
                    area: (item.x1 - item.x0) * (item.y1 - item.y0),
                    dilation: clamp(1, item.scale / baseMinScale, dilation),
                });
            } else if (item.children == null) {
                const { indices } = item;
                if (counter != null) {
                    const fullyVisible = item.x0 >= xvr0 && item.x1 <= xvr1 && item.y0 >= yvr0 && item.y1 <= yvr1;
                    const itemCount = fullyVisible
                        ? indices.length
                        : countVisibleItems(context, indices, { x0: xvr0, y0: yvr0, x1: xvr1, y1: yvr1 });
                    counter.count += itemCount;
                }
                singleDatumIndices?.push(...indices);
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
