import { clamp } from 'ag-charts-core';

import type { Scale } from '../../../scale/scale';
import { aggregationDomain, aggregationXRatioForXValue } from '../aggregation';

const SIZE_QUANTIZATION = 3;
const FILTER_DATUM_THRESHOLD = 5;

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

function getPrimaryDatumIndex(
    xValues: any[],
    yValues: any[],
    _sizeValues: number[] | undefined,
    xd0: number,
    yd0: number,
    xd1: number,
    yd1: number,
    indices: number[],
    x0: number,
    y0: number,
    x1: number,
    y1: number
): number {
    let currentIndex = 0;
    let currentDistanceSquared = Infinity;
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    for (const datumIndex of indices) {
        const xValue = xValues[datumIndex];
        const yValue = yValues[datumIndex];
        if (xValue == null || yValue == null) continue;
        const xRatio = aggregationXRatioForXValue(xValue, xd0, xd1);
        const yRatio = aggregationXRatioForXValue(yValue, yd0, yd1);

        const distanceSquared = (xRatio - midX) ** 2 + (yRatio - midY) ** 2;
        if (distanceSquared < currentDistanceSquared) {
            currentDistanceSquared = distanceSquared;
            currentIndex = datumIndex;
        }
    }
    return currentIndex;
}

function aggregateQuad(
    xValues: any[],
    yValues: any[],
    sizeValues: number[] | undefined,
    xd0: number,
    yd0: number,
    xd1: number,
    yd1: number,
    indices: number[],
    x0: number,
    y0: number,
    x1: number,
    y1: number
): BubbleAggregationNode | undefined {
    if (indices.length < FILTER_DATUM_THRESHOLD) {
        return;
    } else if (x0 === x1 && y0 === y1) {
        const primaryDatumIndex = getPrimaryDatumIndex(
            xValues,
            yValues,
            sizeValues,
            xd0,
            yd0,
            xd1,
            yd1,
            indices,
            x0,
            y0,
            x1,
            y1
        );
        return { scale: 0, x0, y0, x1, y1, indices, primaryDatumIndex, children: null };
    }

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
        const xRatio = aggregationXRatioForXValue(xValue, xd0, xd1);
        const yRatio = aggregationXRatioForXValue(yValue, yd0, yd1);

        const childIndex = (xRatio > midX ? 1 : 0) + (yRatio > midY ? 2 : 0);
        const childBucket = childBuckets[childIndex];
        childBucket.indices.push(datumIndex);
        childBucket.x0 = Math.min(childBucket.x0, xRatio);
        childBucket.y0 = Math.min(childBucket.y0, yRatio);
        childBucket.x1 = Math.max(childBucket.x1, xRatio);
        childBucket.y1 = Math.max(childBucket.y1, yRatio);
    }

    let children: BubbleAggregationNode[] | null = [];
    for (const childBucket of childBuckets) {
        const { indices: childIndices, x0: cx0, x1: cx1, y0: cy0, y1: cy1 } = childBucket;
        const child = aggregateQuad(xValues, yValues, sizeValues, xd0, yd0, xd1, yd1, childIndices, cx0, cy0, cx1, cy1);
        if (child != null) children.push(child);
    }

    if (children.length === 1) {
        // Flatten the tree if there's only one child
        return children[0];
    } else if (children.length === 0) {
        children = null;
    }

    const scale = Math.hypot(x1 - x0, y1 - y0);
    const primaryDatumIndex = getPrimaryDatumIndex(
        xValues,
        yValues,
        sizeValues,
        xd0,
        yd0,
        xd1,
        yd1,
        indices,
        x0,
        y0,
        x1,
        y1
    );
    return { scale, x0, y0, x1, y1, indices, primaryDatumIndex, children };
}

export function aggregateBubbleData(
    xScale: Scale<unknown, number>,
    yScale: Scale<unknown, number>,
    xValues: any[],
    yValues: any[],
    sizeValues: any[] | undefined,
    xDomain: any[],
    yDomain: any[],
    sizeDomain: number[]
): BubbleAggregationFilter[] | undefined {
    const [xd0, xd1] = aggregationDomain(xScale, xDomain);
    const [yd0, yd1] = aggregationDomain(yScale, yDomain);
    const [sd0, sd1] = sizeDomain;

    const filters: BubbleAggregationFilter[] = [];
    if (sizeValues != null && sd1 > sd0) {
        const sizeIndices = Array.from({ length: SIZE_QUANTIZATION }, (): number[] => []);
        for (let datumIndex = 0; datumIndex < sizeValues.length; datumIndex += 1) {
            const sizeValue = sizeValues[datumIndex];
            const sizeRatio = (sizeValue - sd0) / (sd1 - sd0);
            const sizeIndex = (sizeRatio * SIZE_QUANTIZATION) | 0;
            if (sizeIndex >= 0 && sizeIndex < SIZE_QUANTIZATION) {
                sizeIndices[sizeIndex].push(datumIndex);
            }
        }

        for (let i = 0; i < sizeIndices.length; i += 1) {
            const indices = sizeIndices[i];
            const node = aggregateQuad(xValues, yValues, sizeValues, xd0, yd0, xd1, yd1, indices, 0, 0, 1, 1);

            if (node != null) {
                const sizeRatio = i / SIZE_QUANTIZATION;
                filters.push({ sizeRatio, node });
            }
        }
    } else {
        const indices = xValues.map((_, i) => i);
        const node = aggregateQuad(xValues, yValues, undefined, xd0, yd0, xd1, yd1, indices, 0, 0, 1, 1);

        if (node != null) {
            filters.push({ sizeRatio: 0, node });
        }
    }

    return filters.length > 0 ? filters : undefined;
}

export interface AggregationOptions {
    minSize: number;
    maxSize: number;
    xRange: number;
    yRange: number;
    xVisibleRange: [number, number];
    yVisibleRange: [number, number];
}

export interface GroupedAggregation {
    datumIndex: number;
    count: number;
    dilation: number;
}

function computeBubbleAggregationCountIndices(
    dilation: number,
    dataAggregationFilters: BubbleAggregationFilter[],
    { xVisibleRange: [xvr0, xvr1], yVisibleRange: [yvr0, yvr1], xRange, yRange, minSize, maxSize }: AggregationOptions,
    groupedAggregation?: GroupedAggregation[],
    singleDatumIndices?: number[]
) {
    const baseScalingFactor = 1 / Math.min(xRange / (xvr1 - xvr0), yRange / (yvr1 - yvr0));

    let count = 0;
    for (const { sizeRatio, node } of dataAggregationFilters) {
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

            if (item.scale <= minScale) {
                count += 1;
                groupedAggregation?.push({
                    datumIndex: item.primaryDatumIndex,
                    count: item.indices.length,
                    dilation: clamp(1, item.scale / baseMinScale, dilation),
                });
            } else if (item.children == null) {
                count += item.indices.length;
                singleDatumIndices?.push(...item.indices);
            } else {
                queue.push(...item.children);
            }
        }
    }

    groupedAggregation?.sort((a, b) => a.datumIndex - b.datumIndex);
    singleDatumIndices?.sort((a, b) => a - b);

    return count;
}

export function computeBubbleAggregationCount(
    dilation: number,
    dataAggregationFilters: BubbleAggregationFilter[],
    options: AggregationOptions
) {
    return computeBubbleAggregationCountIndices(dilation, dataAggregationFilters, options);
}

export function computeBubbleAggregationData(
    dilation: number,
    dataAggregationFilters: BubbleAggregationFilter[],
    options: AggregationOptions
) {
    const groupedAggregation: GroupedAggregation[] = [];
    const singleDatumIndices: number[] = [];
    computeBubbleAggregationCountIndices(
        dilation,
        dataAggregationFilters,
        options,
        groupedAggregation,
        singleDatumIndices
    );
    return { groupedAggregation, singleDatumIndices };
}
