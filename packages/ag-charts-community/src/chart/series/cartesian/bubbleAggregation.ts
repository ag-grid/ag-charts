import { clamp } from 'ag-charts-core';

import type { ScaleType } from '../../../scale/scale';
import { aggregationDomain, aggregationXRatioForXValue } from '../aggregation';

const SIZE_QUANTIZATION = 3;
const FILTER_DATUM_THRESHOLD = 5;
const FILTER_RANGE_THRESHOLD = 0.05;

export interface BubbleAggregation {
    xValues: any[];
    yValues: any[];
    xd0: number;
    xd1: number;
    yd0: number;
    yd1: number;
    filters: BubbleAggregationFilter[];
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

function getPrimaryDatumIndex(
    xValues: any[],
    yValues: any[],
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

function countVisibleItems(
    xValues: any[],
    yValues: any[],
    xd0: number,
    yd0: number,
    xd1: number,
    yd1: number,
    indices: number[],
    x0: number,
    y0: number,
    x1: number,
    y1: number
) {
    let count = 0;
    for (const datumIndex of indices) {
        const xValue = xValues[datumIndex];
        const yValue = yValues[datumIndex];
        if (xValue == null || yValue == null) continue;
        const xRatio = aggregationXRatioForXValue(xValue, xd0, xd1);
        const yRatio = aggregationXRatioForXValue(yValue, yd0, yd1);

        if (xRatio >= x0 && xRatio <= x1 && yRatio >= y0 && yRatio <= y1) {
            count += 1;
        }
    }

    return count;
}

function quadChildren(
    xValues: any[],
    yValues: any[],
    xd0: number,
    yd0: number,
    xd1: number,
    yd1: number,
    indices: number[],
    x0: number,
    y0: number,
    x1: number,
    y1: number
): BubbleAggregationNode[] {
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

    const children: BubbleAggregationNode[] = [];
    for (const childBucket of childBuckets) {
        const { indices: childIndices, x0: cx0, x1: cx1, y0: cy0, y1: cy1 } = childBucket;
        if (childIndices.length === 0) continue;

        const child = aggregateQuad(xValues, yValues, xd0, yd0, xd1, yd1, childIndices, cx0, cy0, cx1, cy1);
        children.push(child);
    }

    return children;
}

function aggregateQuad(
    xValues: any[],
    yValues: any[],
    xd0: number,
    yd0: number,
    xd1: number,
    yd1: number,
    indices: number[],
    x0: number,
    y0: number,
    x1: number,
    y1: number
): BubbleAggregationNode {
    const terminate =
        (indices.length < FILTER_DATUM_THRESHOLD &&
            x1 - x0 < FILTER_RANGE_THRESHOLD &&
            y1 - y0 < FILTER_RANGE_THRESHOLD) ||
        (x0 === x1 && y0 === y1);

    let children = terminate ? null : quadChildren(xValues, yValues, xd0, yd0, xd1, yd1, indices, x0, y0, x1, y1);

    if (children?.length === 1) {
        // Flatten the tree if there's only one child
        return children[0];
    } else if (children?.length === 0) {
        children = null;
    }

    const scale = Math.hypot(x1 - x0, y1 - y0);
    const primaryDatumIndex = getPrimaryDatumIndex(xValues, yValues, xd0, yd0, xd1, yd1, indices, x0, y0, x1, y1);
    return { scale, x0, y0, x1, y1, indices, primaryDatumIndex, children };
}

export function aggregateBubbleData(
    xScale: ScaleType,
    yScale: ScaleType,
    xValues: any[],
    yValues: any[],
    sizeValues: any[] | undefined,
    xDomain: any[],
    yDomain: any[],
    sizeDomain: number[]
): BubbleAggregation | undefined {
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
            const node = aggregateQuad(xValues, yValues, xd0, yd0, xd1, yd1, indices, 0, 0, 1, 1);

            if (node != null) {
                const sizeRatio = i / SIZE_QUANTIZATION;
                filters.push({ sizeRatio, node });
            }
        }
    } else {
        const indices = xValues.map((_, i) => i);
        const node = aggregateQuad(xValues, yValues, xd0, yd0, xd1, yd1, indices, 0, 0, 1, 1);

        if (node != null) {
            filters.push({ sizeRatio: 0, node });
        }
    }

    return filters.length > 0 ? { xValues, yValues, xd0, xd1, yd0, yd1, filters } : undefined;
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
    const { xValues, yValues, xd0, xd1, yd0, yd1 } = dataAggregation;
    const baseScalingFactor = 1 / Math.min(xRange / (xvr1 - xvr0), yRange / (yvr1 - yvr0));

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
                    dilation: clamp(1, item.scale / baseMinScale, dilation),
                });
            } else if (item.children == null) {
                const { indices } = item;
                if (counter != null) {
                    const fullyVisible = item.x0 >= xvr0 && item.x1 <= xvr1 && item.y0 >= yvr0 && item.y1 <= yvr1;
                    const itemCount = fullyVisible
                        ? indices.length
                        : countVisibleItems(xValues, yValues, xd0, yd0, xd1, yd1, indices, xvr0, yvr0, xvr1, yvr1);
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

    return minDilation;
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

const DILATION_OPACITY_BASIS = 0.1;
const OPACITY_VALUES = [
    [1, 0.0005942761948529496],
    [2, 0.0008875704656862747],
    [3, 0.0011810148590686179],
    [4, 0.0014703224571078243],
    [5, 0.0017515594362744824],
    [6, 0.0020502902879901597],
    [7, 0.002343965992647013],
    [8, 0.0026400620404411585],
    [9, 0.0029327711397059276],
    [10, 0.0032188258272059906],
    [20, 0.006154988511030135],
    [30, 0.00908357230392293],
    [40, 0.012008896292892073],
    [50, 0.014919655330880254],
    [60, 0.017800952818623456],
    [70, 0.020701204044111788],
    [80, 0.023606555606609455],
    [90, 0.026501839001215145],
    [100, 0.029386093749987494],
    [150, 0.04361563725487911],
    [200, 0.05761899050241736],
    [250, 0.07139348728549512],
    [300, 0.08496031403183041],
    [350, 0.09838005055147421],
    [400, 0.11158307215076294],
    [450, 0.12462134497553427],
    [500, 0.13737803002456414],
    [600, 0.16239015395225526],
    [700, 0.18666143458948292],
    [800, 0.2102873575367816],
    [900, 0.2330795726103229],
    [1000, 0.25527410232847747],
    [1500, 0.3567572349879138],
    [2000, 0.44427248621339055],
    [2500, 0.5196061542586446],
    [3000, 0.5848006364889531],
    [3500, 0.640824482230301],
    [4000, 0.6893777818625887],
    [4500, 0.7313639675243161],
    [5000, 0.7675996323527154],
    [6000, 0.8258505062803418],
    [7000, 0.8691116942398438],
    [8000, 0.9014177987128084],
    [9000, 0.925600901500706],
    [10000, 0.9438614583327829],
    [15000, 0.9803500934436336],
    [20000, 0.9836915257353838],
    [25000, 0.9842736511949837],
];

export function computeBubbleDilationOpacity(fillOpacity: number, count: number, dilation: number): number {
    const oldMethod = (1 - (1 - fillOpacity) ** count) / Math.sqrt(dilation);

    if (dilation <= 1) return oldMethod;

    // Opacity values are for a dilation of 16
    // This was computed by observing the data
    count *= 2 ** (8 - 2 * Math.log2(dilation / 2));

    const index = Math.max(
        OPACITY_VALUES.findLastIndex(([c]) => c <= count),
        0
    );
    if (index >= OPACITY_VALUES.length - 1) return oldMethod;

    const [d0, o0] = OPACITY_VALUES[index];
    const [d1, o1] = OPACITY_VALUES[index + 1];

    const ratio = (count - d0) / (d1 - d0);
    const opacity = o0 + ratio * (o1 - o0);

    return Math.min(
        opacity * (fillOpacity / DILATION_OPACITY_BASIS),
        // Old method has better max opacity
        oldMethod
    );
}
