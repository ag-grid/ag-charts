import { aggregationXRatioForXValue, areaSizeAtRatio, clamp } from 'ag-charts-core';

import type { DataModel } from '../../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../../data/dataModelTypes';
import { stubAggregationDataModel } from '../../test/aggregationStubs';
import { BIG } from '../../test/bigintExamples';
import type { BubbleAggregation, BubbleAggregationNode, BubbleAggregationOptions } from './bubbleAggregation';
import {
    aggregateBubbleDataFromDataModel,
    computeBubbleAggregation,
    computeBubbleAggregationCount,
    computeBubbleAggregationData,
} from './bubbleAggregation';

const SIZE_QUANTIZATION = 3;

/** The datum indices a node represents, as a plain array. */
function nodeIndices(aggregation: BubbleAggregation, node: BubbleAggregationNode): number[] {
    return Array.from(aggregation.indices.subarray(node.start, node.end));
}

function expectFiniteBounds(node: BubbleAggregationNode) {
    expect(Number.isFinite(node.x0)).toBe(true);
    expect(Number.isFinite(node.x1)).toBe(true);
    expect(Number.isFinite(node.y0)).toBe(true);
    expect(Number.isFinite(node.y1)).toBe(true);
    for (const child of node.children ?? []) {
        expectFiniteBounds(child);
    }
}

describe('computeBubbleAggregation', () => {
    describe('basic aggregation', () => {
        it('should create aggregation for simple dataset without size values', () => {
            const xValues = Array.from({ length: 100 }, (_, i) => i);
            const yValues = Array.from({ length: 100 }, (_, i) => i * 2);
            const xDomain: [number, number] = [0, 99];
            const yDomain: [number, number] = [0, 198];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.filters).toBeDefined();
            expect(result!.filters.length).toBeGreaterThan(0);
        });

        it('should create aggregation with size values', () => {
            const xValues = Array.from({ length: 100 }, (_, i) => i);
            const yValues = Array.from({ length: 100 }, (_, i) => i * 2);
            const sizeValues = Array.from({ length: 100 }, (_, i) => 10 + i);
            const xDomain: [number, number] = [0, 99];
            const yDomain: [number, number] = [0, 198];
            const sizeDomain: [number, number] = [10, 109];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, sizeValues, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.filters).toBeDefined();
            // Should have SIZE_QUANTIZATION (3) filters for different size ranges
            expect(result!.filters.length).toBe(SIZE_QUANTIZATION);
            // Verify each filter has distinct sizeRatio values
            const sizeRatios = result!.filters.map((f) => f.sizeRatio);
            expect(new Set(sizeRatios).size).toBe(SIZE_QUANTIZATION);
            // Verify sizeRatio values are in valid range [0, 1)
            for (const filter of result!.filters) {
                expect(filter.sizeRatio).toBeGreaterThanOrEqual(0);
                expect(filter.sizeRatio).toBeLessThan(1);
            }
        });

        it('should return undefined when size domain has no range', () => {
            const xValues = Array.from({ length: 100 }, (_, i) => i);
            const yValues = Array.from({ length: 100 }, (_, i) => i * 2);
            const sizeValues = Array.from({ length: 100 }, () => 50); // All same size
            const xDomain: [number, number] = [0, 99];
            const yDomain: [number, number] = [0, 198];
            const sizeDomain: [number, number] = [50, 50]; // No range

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, sizeValues, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            // Should still create aggregation but with single filter (no size quantization)
            expect(result).toBeDefined();
            expect(result!.filters.length).toBe(1);
            expect(result!.filters[0].sizeRatio).toBe(0);
        });
    });

    describe('quadtree structure', () => {
        it('should create hierarchical quadtree nodes', () => {
            // Use deterministic data instead of random
            const xValues = Array.from({ length: 100 }, (_, i) => (i % 10) * 10);
            const yValues = Array.from({ length: 100 }, (_, i) => Math.floor(i / 10) * 10);
            const xDomain: [number, number] = [0, 100];
            const yDomain: [number, number] = [0, 100];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const node = result!.filters[0].node;
            expect(node).toBeDefined();
            expect(node).toHaveProperty('scale');
            expect(node).toHaveProperty('start');
            expect(node).toHaveProperty('end');
            expect(node).toHaveProperty('primaryDatumIndex');
            expect(node).toHaveProperty('children');
            // Verify node structure
            expect(nodeIndices(result!, node!).length).toBeGreaterThan(0);
            expect(nodeIndices(result!, node!).length).toBeLessThanOrEqual(100);
            expect(node!.primaryDatumIndex).toBeGreaterThanOrEqual(0);
            expect(node!.primaryDatumIndex).toBeLessThan(100);
            expect(nodeIndices(result!, node!)).toContain(node!.primaryDatumIndex);
        });

        it('should have nodes with valid bounds', () => {
            const xValues = Array.from({ length: 50 }, (_, i) => i);
            const yValues = Array.from({ length: 50 }, (_, i) => i);
            const xDomain: [number, number] = [0, 49];
            const yDomain: [number, number] = [0, 49];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const node = result!.filters[0].node;

            expect(node!.x0).toBeGreaterThanOrEqual(0);
            expect(node!.x0).toBeLessThanOrEqual(1);
            expect(node!.x1).toBeGreaterThanOrEqual(0);
            expect(node!.x1).toBeLessThanOrEqual(1);
            expect(node!.y0).toBeGreaterThanOrEqual(0);
            expect(node!.y0).toBeLessThanOrEqual(1);
            expect(node!.y1).toBeGreaterThanOrEqual(0);
            expect(node!.y1).toBeLessThanOrEqual(1);

            expect(node!.x1).toBeGreaterThanOrEqual(node!.x0);
            expect(node!.y1).toBeGreaterThanOrEqual(node!.y0);
            // Root node should cover full domain [0, 1] for both axes
            expect(node!.x0).toBe(0);
            expect(node!.x1).toBe(1);
            expect(node!.y0).toBe(0);
            expect(node!.y1).toBe(1);
        });

        it('should have valid primary datum indices', () => {
            const xValues = Array.from({ length: 50 }, (_, i) => i);
            const yValues = Array.from({ length: 50 }, (_, i) => i);
            const xDomain: [number, number] = [0, 49];
            const yDomain: [number, number] = [0, 49];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            function validateNode(node: any) {
                expect(node.primaryDatumIndex).toBeGreaterThanOrEqual(0);
                expect(node.primaryDatumIndex).toBeLessThan(xValues.length);
                expect(nodeIndices(result!, node)).toContain(node.primaryDatumIndex);

                if (node.children) {
                    for (const child of node.children) {
                        validateNode(child);
                    }
                }
            }

            validateNode(result!.filters[0].node);
        });
    });

    describe('size quantization', () => {
        it('should create filters for different size ranges', () => {
            const count = 300;
            const xValues = Array.from({ length: count }, (_, i) => i);
            const yValues = Array.from({ length: count }, (_, i) => i);
            const sizeValues = Array.from({ length: count }, (_, i) => 10 + (i / count) * 90); // Range 10-100
            const xDomain: [number, number] = [0, count - 1];
            const yDomain: [number, number] = [0, count - 1];
            const sizeDomain: [number, number] = [10, 100];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, sizeValues, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            // Should have SIZE_QUANTIZATION filters for different size quantiles
            expect(result!.filters.length).toBe(SIZE_QUANTIZATION);

            // Verify sizeRatio values are distinct and in valid range [0, 1)
            const sizeRatios = result!.filters.map((f) => f.sizeRatio).sort((a, b) => a - b);
            for (let i = 0; i < sizeRatios.length; i++) {
                expect(sizeRatios[i]).toBeGreaterThanOrEqual(0);
                expect(sizeRatios[i]).toBeLessThan(1);
                if (i > 0) {
                    expect(sizeRatios[i]).toBeGreaterThan(sizeRatios[i - 1]);
                }
            }
            // Verify each filter has a node with indices
            for (const filter of result!.filters) {
                expect(filter.node).toBeDefined();
                expect(nodeIndices(result!, filter.node!).length).toBeGreaterThan(0);
            }
        });

        it('should group bubbles by size into quantiles', () => {
            const count = 300;
            // Use deterministic but more spread out spatial distribution to avoid quadtree recursion issues
            const xValues = Array.from({ length: count }, (_, i) => ((i * 7) % 100) + (i % 3)); // Spread out with some variation
            const yValues = Array.from({ length: count }, (_, i) => ((i * 11) % 100) + (i % 5)); // Spread out with some variation
            const sizeValues = Array.from({ length: count }, (_, i) => Math.floor((i / count) * 100)); // 0-99
            const xDomain: [number, number] = [0, 100];
            const yDomain: [number, number] = [0, 100];
            const sizeDomain: [number, number] = [0, 99];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, sizeValues, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.filters.length).toBe(SIZE_QUANTIZATION);
            // Verify that indices are distributed across size quantiles
            const allIndices = new Set<number>();
            for (const filter of result!.filters) {
                expect(filter.node).toBeDefined();
                expect(nodeIndices(result!, filter.node!).length).toBeGreaterThan(0);
                for (const idx of nodeIndices(result!, filter.node!)) {
                    allIndices.add(idx);
                }
            }
            // Most indices should be covered (allowing for some overlap at boundaries)
            expect(allIndices.size).toBeGreaterThan(count * 0.5);
        });
    });

    describe('spatial distribution', () => {
        it('should handle uniform spatial distribution', () => {
            const xValues = Array.from({ length: 100 }, (_, i) => Math.floor(i / 10));
            const yValues = Array.from({ length: 100 }, (_, i) => i % 10);
            const xDomain: [number, number] = [0, 9];
            const yDomain: [number, number] = [0, 9];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.filters[0].node).toBeDefined();
        });

        it('should handle clustered spatial distribution', () => {
            const cluster1X = Array.from({ length: 50 }, () => 10 + Math.random() * 5);
            const cluster1Y = Array.from({ length: 50 }, () => 10 + Math.random() * 5);
            const cluster2X = Array.from({ length: 50 }, () => 80 + Math.random() * 5);
            const cluster2Y = Array.from({ length: 50 }, () => 80 + Math.random() * 5);

            const xValues = [...cluster1X, ...cluster2X];
            const yValues = [...cluster1Y, ...cluster2Y];
            const xDomain: [number, number] = [0, 100];
            const yDomain: [number, number] = [0, 100];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.filters[0].node).toBeDefined();
        });

        it('should handle all points at same location', () => {
            const xValues = Array.from({ length: 50 }, () => 50);
            const yValues = Array.from({ length: 50 }, () => 50);
            const xDomain: [number, number] = [0, 100];
            const yDomain: [number, number] = [0, 100];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const node = result!.filters[0].node;
            expect(node).toBeDefined();
            // Should terminate early due to x0 === x1 && y0 === y1
            expect(node!.children).toBeNull();
        });
    });

    describe('valueOf conversion flags', () => {
        it('should handle xNeedsValueOf = true for Date objects', () => {
            const startDate = new Date('2020-01-01').getTime();
            const xValues = Array.from({ length: 50 }, (_, i) => new Date(startDate + i * 86400000));
            const yValues = Array.from({ length: 50 }, (_, i) => i * 10);
            const xDomain: [number, number] = [startDate, startDate + 49 * 86400000];
            const yDomain: [number, number] = [0, 490];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: true,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.filters[0].node).toBeDefined();
        });

        it('should handle yNeedsValueOf = true for wrapped values', () => {
            const xValues = Array.from({ length: 50 }, (_, i) => i);
            const yValues = Array.from({ length: 50 }, (_, i) => ({ valueOf: () => i * 10 }));
            const xDomain: [number, number] = [0, 49];
            const yDomain: [number, number] = [0, 490];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: true,
            });

            expect(result).toBeDefined();
            expect(result!.filters[0].node).toBeDefined();
        });

        it('should handle both xNeedsValueOf and yNeedsValueOf = true', () => {
            const startDate = new Date('2020-01-01').getTime();
            const xValues = Array.from({ length: 50 }, (_, i) => new Date(startDate + i * 86400000));
            const yValues = Array.from({ length: 50 }, (_, i) => ({ valueOf: () => i * 10 }));
            const xDomain: [number, number] = [startDate, startDate + 49 * 86400000];
            const yDomain: [number, number] = [0, 490];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: true,
                yNeedsValueOf: true,
            });

            expect(result).toBeDefined();
            expect(result!.filters[0].node).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle null X values', () => {
            const xValues = [1, 2, null, 4, 5];
            const yValues = [10, 20, 30, 40, 50];
            const xDomain: [number, number] = [1, 5];
            const yDomain: [number, number] = [10, 50];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            // Should skip null values
        });

        it('should handle null Y values', () => {
            const xValues = [1, 2, 3, 4, 5];
            const yValues = [10, null, 30, null, 50];
            const xDomain: [number, number] = [1, 5];
            const yDomain: [number, number] = [10, 50];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            // Should skip null values
        });

        it('should handle empty dataset', () => {
            const xValues: any[] = [];
            const yValues: any[] = [];
            const xDomain: [number, number] = [0, 0];
            const yDomain: [number, number] = [0, 0];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            // Bubble aggregation returns a structure even for empty data (with empty indices)
            expect(result).toBeDefined();
            expect(nodeIndices(result!, result!.filters[0].node!)).toEqual([]);
        });

        it('should handle single point', () => {
            const xValues = [50];
            const yValues = [50];
            const xDomain: [number, number] = [0, 100];
            const yDomain: [number, number] = [0, 100];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.filters[0].node).toBeDefined();
            expect(nodeIndices(result!, result!.filters[0].node!)).toEqual([0]);
        });

        it('should handle a single-valued X domain', () => {
            const count = 1000;
            const xValues = Array.from({ length: count }, () => 5);
            const yValues = Array.from({ length: count }, (_, i) => i);
            const xDomain: [number, number] = [5, 5];
            const yDomain: [number, number] = [0, count - 1];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const node = result!.filters[0].node;
            expect(node).toBeDefined();
            expect(nodeIndices(result!, node!)).toHaveLength(count);
            expectFiniteBounds(node!);
        });

        it('should handle a single-valued Y domain', () => {
            const count = 1000;
            const xValues = Array.from({ length: count }, (_, i) => i);
            const yValues = Array.from({ length: count }, () => 5);
            const xDomain: [number, number] = [0, count - 1];
            const yDomain: [number, number] = [5, 5];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            const node = result!.filters[0].node;
            expect(node).toBeDefined();
            expect(nodeIndices(result!, node!)).toHaveLength(count);
            expectFiniteBounds(node!);
        });
    });

    describe('aggregation structure', () => {
        it('should return correct BubbleAggregation structure', () => {
            const xValues = Array.from({ length: 50 }, (_, i) => i);
            const yValues = Array.from({ length: 50 }, (_, i) => i);
            const xDomain: [number, number] = [0, 49];
            const yDomain: [number, number] = [0, 49];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result).toHaveProperty('xValues');
            expect(result).toHaveProperty('yValues');
            expect(result).toHaveProperty('xd0');
            expect(result).toHaveProperty('xd1');
            expect(result).toHaveProperty('yd0');
            expect(result).toHaveProperty('yd1');
            expect(result).toHaveProperty('filters');
            expect(result).toHaveProperty('xNeedsValueOf');
            expect(result).toHaveProperty('yNeedsValueOf');
        });

        it('should preserve original value arrays in result', () => {
            const xValues = Array.from({ length: 50 }, (_, i) => i);
            const yValues = Array.from({ length: 50 }, (_, i) => i);
            const xDomain: [number, number] = [0, 49];
            const yDomain: [number, number] = [0, 49];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.xValues).toBe(xValues);
            expect(result!.yValues).toBe(yValues);
        });

        it('should preserve domain bounds in result', () => {
            const xValues = Array.from({ length: 50 }, (_, i) => i);
            const yValues = Array.from({ length: 50 }, (_, i) => i);
            const xDomain: [number, number] = [0, 49];
            const yDomain: [number, number] = [0, 49];
            const sizeDomain: [number, number] = [0, 0];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, undefined, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.xd0).toBe(0);
            expect(result!.xd1).toBe(49);
            expect(result!.yd0).toBe(0);
            expect(result!.yd1).toBe(49);
        });
    });
});

describe('aggregateBubbleDataFromDataModel - bigint and ISO 8601 time values (render hardening)', () => {
    // Exercises the real aggregation entry point (where high-volume bigint/ISO columns must be narrowed)
    // rather than the lower-level compute function. x via the raw 'object' column; no size key.
    const series: ScopeProvider = { id: 'series-1' };
    // Bubble aggregation reads a per-column domain (x and y), so the shared stub's single domain is
    // overridden with an id-dispatching one.
    const withDomains = (model: DataModel<any, any, any>, domains: Record<string, any[]>) =>
        Object.assign(model, {
            getDomain: (_s: unknown, id: string) => ({ domain: domains[id], sortMetadata: { sortOrder: 1 as const } }),
        });
    const stubDataModel = (xValues: any[], yValues: any[], xDomain: any[], yDomain: any[]) =>
        withDomains(stubAggregationDataModel([], { xValue: xValues, yValue: yValues }, xDomain), {
            xValue: xDomain,
            yValue: yDomain,
        });

    it('aggregates bigint y values beyond MAX_SAFE_INTEGER', () => {
        const N = 2000;
        const xValues = Array.from({ length: N }, (_, i) => i);
        const yValues = Array.from({ length: N }, (_, i) => BIG + BigInt(i) * 1_000_000_000n);
        // y domain is the actual bigint extent, as the real pipeline derives it, so ratios stay within [0, 1].
        const yDomain = [yValues[0], yValues[N - 1]];

        const result = aggregateBubbleDataFromDataModel(
            'number',
            'number',
            stubDataModel(xValues, yValues, [0, N - 1], yDomain),
            {} as ProcessedData<any>,
            undefined,
            false,
            series
        );

        expect(result).toBeDefined();
        expect(result!.filters.length).toBeGreaterThan(0);
    });

    it('aggregates bigint size values beyond MAX_SAFE_INTEGER (size column must be narrowed like x/y)', () => {
        // x and y are narrowed before quantisation, and the size column must be narrowed the same way:
        // `sizeValue - sd0` (sd0 from the Number-narrowed size scale) must not throw on a bigint size.
        const N = 2000;
        const xValues = Array.from({ length: N }, (_, i) => i);
        const yValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10));
        const sizeValues = Array.from({ length: N }, (_, i) => BIG + BigInt(i) * 1_000_000_000n);
        const sizeStub = withDomains(
            stubAggregationDataModel([], { xValue: xValues, yValue: yValues, sizeValue: sizeValues }, [0, N - 1]),
            { xValue: [0, N - 1], yValue: [-1, 1] }
        );
        // The real size scale is a LinearScale with a Number-narrowed domain, so sd0/sd1 are numbers.
        const sizeScale = { domain: [Number(sizeValues[0]), Number(sizeValues[N - 1])] };

        const result = aggregateBubbleDataFromDataModel(
            'number',
            'number',
            sizeStub,
            {} as ProcessedData<any>,
            sizeScale,
            true,
            series
        );

        expect(result).toBeDefined();
        expect(result!.filters.length).toBeGreaterThan(0);
    });

    it('aggregates ISO 8601 string timestamps on a time scale', () => {
        const N = 2000;
        const startMs = Date.UTC(2024, 0, 1);
        const xValues = Array.from({ length: N }, (_, i) => new Date(startMs + i * 60_000).toISOString());
        const yValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10));
        const xDomain = [new Date(xValues[0]), new Date(xValues[N - 1])];

        const result = aggregateBubbleDataFromDataModel(
            'time',
            'number',
            stubDataModel(xValues, yValues, xDomain, [-1, 1]),
            {} as ProcessedData<any>,
            undefined,
            false,
            series
        );

        expect(result).toBeDefined();
        expect(result!.filters.length).toBeGreaterThan(0);
    });

    // The quadtree partitions by xRatio, so the domain min must be subtracted in bigint before
    // narrowing or a high-magnitude narrow-range X column collapses to a zero-width domain.
    it('downsampling keeps a non-degenerate X domain when the X span is below the double ULP at that magnitude', () => {
        const N = 2000;
        const BASE = 2n ** 60n + 123_456_789n;
        const DELTA = 100n; // < half-ULP (128): BASE ± DELTA narrow to the same double as BASE absolutely

        const xValues = Array.from({ length: N }, (_, i) => BASE - DELTA + BigInt(i % 3) * DELTA); // {BASE-DELTA, BASE, BASE+DELTA}
        const yValues = Array.from({ length: N }, (_, i) => Math.sin(i / 10));
        const xDomain = [BASE - DELTA, BASE + DELTA];

        const result = aggregateBubbleDataFromDataModel(
            'number',
            'number',
            stubDataModel(xValues, yValues, xDomain, [-1, 1]),
            {} as ProcessedData<any>,
            undefined,
            false,
            series
        );
        expect(result).toBeDefined();

        // A naive absolute narrow collapses the X domain to zero width (xd0 === xd1), degenerating every xRatio.
        expect(result!.xd1).toBeGreaterThan(result!.xd0);
    });
});

describe('computeBubbleAggregationCount sizeMode', () => {
    it('uses a larger cull radius in area mode, so it keeps no more items than diameter mode', () => {
        const xValues = Array.from({ length: 400 }, (_, i) => (i * 7) % 50);
        const yValues = Array.from({ length: 400 }, (_, i) => (i * 13) % 50);
        const sizeValues = Array.from({ length: 400 }, (_, i) => i % 100);
        const aggregation = computeBubbleAggregation([0, 49], [0, 49], xValues, yValues, sizeValues, [0, 99], {
            xNeedsValueOf: false,
            yNeedsValueOf: false,
        })!;
        const options = {
            xRange: 200,
            yRange: 200,
            xVisibleRange: [0, 1] as [number, number],
            yVisibleRange: [0, 1] as [number, number],
            minSize: 5,
            maxSize: 60,
        };

        const dilations = [2, 4, 8, 16, 32];
        const counts = (sizeMode?: 'area') =>
            dilations.map((d) => computeBubbleAggregationCount(d, aggregation, { ...options, sizeMode }));
        const diameterCounts = counts();
        const areaCounts = counts('area');
        for (const [i, count] of areaCounts.entries()) {
            expect(count).toBeLessThanOrEqual(diameterCounts[i]);
        }
        expect(areaCounts).not.toEqual(diameterCounts);
    });
});

/**
 * The quadtree as it was built before the datum indices were partitioned in place: every node owned its own
 * `indices` array, copied from its parent. Kept as an oracle for the shared-buffer implementation.
 */
interface ReferenceNode {
    scale: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    indices: number[];
    primaryDatumIndex: number;
    children: ReferenceNode[] | null;
}

interface ReferenceContext {
    xValues: any[];
    yValues: any[];
    xd0: number;
    xd1: number;
    yd0: number;
    yd1: number;
}

type Bounds = { x0: number; y0: number; x1: number; y1: number };

function referenceRatios(ctx: ReferenceContext, datumIndex: number): [number, number] | undefined {
    const xValue = ctx.xValues[datumIndex];
    const yValue = ctx.yValues[datumIndex];
    if (xValue == null || yValue == null) return undefined;
    return [
        aggregationXRatioForXValue(xValue, ctx.xd0, ctx.xd1, false),
        aggregationXRatioForXValue(yValue, ctx.yd0, ctx.yd1, false),
    ];
}

function referenceQuad(ctx: ReferenceContext, indices: number[], bounds: Bounds): ReferenceNode {
    const { x0, y0, x1, y1 } = bounds;
    const terminate =
        !Number.isFinite(x1 - x0) ||
        !Number.isFinite(y1 - y0) ||
        (indices.length < 5 && x1 - x0 < 0.05 && y1 - y0 < 0.05) ||
        (x0 === x1 && y0 === y1);

    let children: ReferenceNode[] | null = null;
    if (!terminate) {
        const buckets = Array.from({ length: 4 }, () => ({ x0: 1, y0: 1, x1: 0, y1: 0, indices: [] as number[] }));
        const midX = (x0 + x1) / 2;
        const midY = (y0 + y1) / 2;
        for (const datumIndex of indices) {
            const ratios = referenceRatios(ctx, datumIndex);
            if (ratios == null) continue;
            const [xRatio, yRatio] = ratios;
            const bucket = buckets[(xRatio > midX ? 1 : 0) + (yRatio > midY ? 2 : 0)];
            bucket.indices.push(datumIndex);
            bucket.x0 = Math.min(bucket.x0, xRatio);
            bucket.y0 = Math.min(bucket.y0, yRatio);
            bucket.x1 = Math.max(bucket.x1, xRatio);
            bucket.y1 = Math.max(bucket.y1, yRatio);
        }
        children = buckets.filter((b) => b.indices.length > 0).map((b) => referenceQuad(ctx, b.indices, b));
        if (children.length === 1) return children[0];
        if (children.length === 0) children = null;
    }

    let primaryDatumIndex = 0;
    let best = Infinity;
    for (const datumIndex of indices) {
        const ratios = referenceRatios(ctx, datumIndex);
        if (ratios == null) continue;
        const d = (ratios[0] - (x0 + x1) / 2) ** 2 + (ratios[1] - (y0 + y1) / 2) ** 2;
        if (d < best) {
            best = d;
            primaryDatumIndex = datumIndex;
        }
    }
    return { scale: Math.hypot(x1 - x0, y1 - y0), x0, y0, x1, y1, indices, primaryDatumIndex, children };
}

function referenceTrees(
    aggregation: BubbleAggregation,
    sizeValues: number[] | undefined,
    sizeDomain: [number, number]
): Array<{ sizeRatio: number; node: ReferenceNode }> {
    const ctx: ReferenceContext = aggregation;
    const unit = { x0: 0, y0: 0, x1: 1, y1: 1 };
    const [sd0, sd1] = sizeDomain;
    if (sizeValues == null || sd1 <= sd0) {
        const all = aggregation.xValues.map((_, i) => i);
        return [{ sizeRatio: 0, node: referenceQuad(ctx, all, unit) }];
    }
    const buckets = Array.from({ length: SIZE_QUANTIZATION }, () => [] as number[]);
    for (const [datumIndex, sizeValue] of sizeValues.entries()) {
        const sizeIndex = Math.trunc(((sizeValue - sd0) / (sd1 - sd0)) * SIZE_QUANTIZATION);
        if (sizeIndex >= 0 && sizeIndex < SIZE_QUANTIZATION) buckets[sizeIndex].push(datumIndex);
    }
    return buckets.map((indices, i) => ({ sizeRatio: i / SIZE_QUANTIZATION, node: referenceQuad(ctx, indices, unit) }));
}

function referenceWalk(
    trees: Array<{ sizeRatio: number; node: ReferenceNode }>,
    ctx: ReferenceContext,
    dilation: number,
    options: BubbleAggregationOptions
) {
    const { xRange, yRange, minSize, maxSize, sizeMode } = options;
    const [xvr0, xvr1] = options.xVisibleRange;
    const [yvr0, yvr1] = options.yVisibleRange;
    const baseScalingFactor = 1 / Math.min(xRange / (xvr1 - xvr0), yRange / (yvr1 - yvr0));
    const grouped: Array<{ datumIndex: number; count: number; area: number; dilation: number; indices: number[] }> = [];
    const singles: number[] = [];
    let count = 0;

    for (const { sizeRatio, node } of trees) {
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
            if (item.x1 < x0 || item.x0 > x1 || item.y1 < y0 || item.y0 > y1) continue;

            if (dilation !== 1 && item.scale <= minScale) {
                count += 1;
                grouped.push({
                    datumIndex: item.primaryDatumIndex,
                    count: item.indices.length,
                    area: (item.x1 - item.x0) * (item.y1 - item.y0),
                    dilation: clamp(1, item.scale / baseMinScale, dilation),
                    indices: item.indices,
                });
            } else if (item.children == null) {
                const fullyVisible = item.x0 >= xvr0 && item.x1 <= xvr1 && item.y0 >= yvr0 && item.y1 <= yvr1;
                for (const datumIndex of item.indices) {
                    singles.push(datumIndex);
                    if (fullyVisible) continue;
                    const ratios = referenceRatios(ctx, datumIndex);
                    if (ratios != null && ratios[0] >= xvr0 && ratios[0] <= xvr1 && ratios[1] >= yvr0) {
                        if (ratios[1] <= yvr1) count += 1;
                    }
                }
                if (fullyVisible) count += item.indices.length;
            } else {
                queue.push(...item.children);
            }
        }
    }
    return { grouped, singles, count };
}

function groupSummary({
    datumIndex,
    count,
    area,
    dilation,
}: {
    datumIndex: number;
    count: number;
    area: number;
    dilation: number;
}) {
    return { datumIndex, count, area, dilation };
}

function expectSameTree(aggregation: BubbleAggregation, node: BubbleAggregationNode, expected: ReferenceNode) {
    expect(node.scale).toBe(expected.scale);
    expect([node.x0, node.y0, node.x1, node.y1]).toEqual([expected.x0, expected.y0, expected.x1, expected.y1]);
    expect(node.primaryDatumIndex).toBe(expected.primaryDatumIndex);

    const indices = nodeIndices(aggregation, node);
    if (node.children == null) {
        // A leaf's range is never partitioned again, so it keeps its datum order.
        expect(indices).toEqual(expected.indices);
        expect(expected.children).toBeNull();
        return;
    }

    expect([...indices].sort((a, b) => a - b)).toEqual(expected.indices);
    expect(node.children.length).toBe(expected.children!.length);
    for (const [i, child] of node.children.entries()) {
        expectSameTree(aggregation, child, expected.children![i]);
    }
}

describe('computeBubbleAggregation partitions indices in place', () => {
    function random(seed: number) {
        let state = seed;
        return () => {
            state = (state + 0x6d2b79f5) >>> 0;
            let t = Math.imul(state ^ (state >>> 15), 1 | state);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    interface Dataset {
        xValues: Array<number | null | undefined>;
        yValues: Array<number | null | undefined>;
        sizeValues: number[];
    }

    function dataset(count: number, seed: number, make: (r: () => number, i: number) => number[]): Dataset {
        const r = random(seed);
        const points = Array.from({ length: count }, (_, i) => make(r, i));
        return {
            xValues: points.map((p) => p[0]),
            yValues: points.map((p) => p[1]),
            sizeValues: points.map((p) => p[2]),
        };
    }

    const uniform = dataset(3000, 1, (r) => [r() * 1000, r() * 500, r() * 100]);
    const clustered = dataset(2500, 2, (r, i) =>
        i < 3 ? [i * 5000, i * 5000, 50] : [1000 + r() * 4, 1000 + r() * 4, r() * 100]
    );
    const withNulls = dataset(2000, 3, (r) => [r() * 100, r() * 100, r() * 100]);
    for (let i = 0; i < withNulls.xValues.length; i++) {
        if (i % 17 === 0) withNulls.xValues[i] = undefined;
        if (i % 29 === 0) withNulls.yValues[i] = null;
    }
    const leadingNulls = dataset(400, 4, (r) => [r() * 10, r() * 10, r() * 100]);
    for (let i = 0; i < 40; i++) leadingNulls.xValues[i] = undefined;
    const allEqual = dataset(600, 5, () => [7, 7, 40]);
    const sizeOutOfDomain = dataset(1500, 6, (r) => [r() * 100, r() * 100, r() * 160 - 30]);
    sizeOutOfDomain.sizeValues[10] = Number.NaN;
    const lattice = dataset(1800, 7, (r) => [Math.floor(r() * 20), Math.floor(r() * 20), r() * 100]);

    // Geometrically nested points peel off one per level while five or more remain, so the tree gets deeper than
    // the build's initial per-depth buffers.
    const nested = Array.from({ length: 40 }, (_, k) => 2 ** -k * 1e-3);
    const deepCluster: Dataset = {
        xValues: [0, 1, ...nested.map((d) => 0.3 + d)],
        yValues: [0, 1, ...nested.map((d) => 0.6 + d)],
        sizeValues: Array.from({ length: nested.length + 2 }, (_, i) => i * 2),
    };

    const datasets: Array<[string, Dataset]> = [
        ['deep cluster', deepCluster],
        ['uniform', uniform],
        ['clustered', clustered],
        ['nulls', withNulls],
        ['leading nulls', leadingNulls],
        ['all equal', allEqual],
        ['size out of domain', sizeOutOfDomain],
        ['lattice', lattice],
    ];

    const domainOf = (values: Array<number | null | undefined>): [number, number] => {
        const numbers = values.filter((v): v is number => v != null);
        return [Math.min(...numbers), Math.max(...numbers)];
    };

    const walkOptions: BubbleAggregationOptions[] = [
        { xRange: 400, yRange: 300, xVisibleRange: [0, 1], yVisibleRange: [0, 1], minSize: 4, maxSize: 40 },
        {
            xRange: 400,
            yRange: 300,
            xVisibleRange: [0.2, 0.55],
            yVisibleRange: [0.3, 0.9],
            minSize: 4,
            maxSize: 40,
            sizeMode: 'area',
        },
    ];

    describe.each(datasets)('%s', (_name, data) => {
        for (const withSize of [false, true]) {
            it(`matches the per-node arrays ${withSize ? 'with' : 'without'} size quantisation`, () => {
                const sizeValues = withSize ? data.sizeValues : undefined;
                const sizeDomain: [number, number] = withSize ? [0, 100] : [0, 0];
                const aggregation = computeBubbleAggregation(
                    domainOf(data.xValues),
                    domainOf(data.yValues),
                    data.xValues,
                    data.yValues,
                    sizeValues,
                    sizeDomain,
                    { xNeedsValueOf: false, yNeedsValueOf: false }
                )!;
                expect(aggregation).toBeDefined();

                const trees = referenceTrees(aggregation, sizeValues, sizeDomain);
                expect(aggregation.filters.map((f) => f.sizeRatio)).toEqual(trees.map((t) => t.sizeRatio));
                for (const [i, filter] of aggregation.filters.entries()) {
                    expectSameTree(aggregation, filter.node!, trees[i].node);
                }

                for (const options of walkOptions) {
                    for (const dilation of [1, 2.5, 12, 80]) {
                        const expected = referenceWalk(trees, aggregation, dilation, options);
                        const actual = computeBubbleAggregationData(dilation, aggregation, options);

                        expect(actual.singleDatumIndices).toEqual(expected.singles);
                        expect(actual.groupedAggregation.map(groupSummary)).toEqual(expected.grouped.map(groupSummary));
                        const actualGroups = actual.groupedAggregation.map((g) => [...g.indices].sort((a, b) => a - b));
                        expect(actualGroups).toEqual(expected.grouped.map((g) => g.indices));
                        expect(computeBubbleAggregationCount(dilation, aggregation, options)).toBe(expected.count);
                    }
                }
            });
        }
    });

    it('builds trees deeper than its initial per-depth buffers', () => {
        const aggregation = computeBubbleAggregation(
            [0, 1],
            [0, 1],
            deepCluster.xValues,
            deepCluster.yValues,
            undefined,
            [0, 0],
            { xNeedsValueOf: false, yNeedsValueOf: false }
        )!;

        const depthOf = (node: BubbleAggregationNode): number =>
            1 + Math.max(0, ...(node.children ?? []).map((child) => depthOf(child)));
        expect(depthOf(aggregation.filters[0].node!)).toBeGreaterThan(32);
    });

    it('keeps every datum of a node inside the shared buffer exactly once per size bucket', () => {
        const aggregation = computeBubbleAggregation(
            domainOf(withNulls.xValues),
            domainOf(withNulls.yValues),
            withNulls.xValues,
            withNulls.yValues,
            withNulls.sizeValues,
            [0, 100],
            { xNeedsValueOf: false, yNeedsValueOf: false }
        )!;

        const seen = [...aggregation.indices].sort((a, b) => a - b);
        expect(seen).toEqual(Array.from({ length: withNulls.xValues.length }, (_, i) => i));
        expect(aggregation.filters.reduce((n, f) => n + f.node!.end - f.node!.start, 0)).toBe(seen.length);
    });
});

describe('computeBubbleAggregation node contents', () => {
    const NUMBERS = { xNeedsValueOf: false, yNeedsValueOf: false };
    // Every size bubble is 100px across and the plot is 100px square, so a dilation of 4 groups any node whose
    // diagonal is at most 2 (the unit square's is 1.41).
    const WALK: BubbleAggregationOptions = {
        xRange: 100,
        yRange: 100,
        xVisibleRange: [0, 1],
        yVisibleRange: [0, 1],
        minSize: 100,
        maxSize: 100,
    };

    const aggregate = (
        xValues: Array<number | null | undefined>,
        yValues: Array<number | null | undefined>,
        sizeValues?: number[],
        domain: [number, number] = [0, 100],
        sizeDomain: [number, number] = [0, 0]
    ) => computeBubbleAggregation(domain, domain, xValues, yValues, sizeValues, sizeDomain, NUMBERS)!;

    // A datum in each corner of the domain, listed against quadrant order (so datum order differs from the order of
    // the quadrants) and followed by a datum with no x and a datum with no y.
    const corners = {
        xValues: [100, 0, 100, 0, null, 50],
        yValues: [100, 100, 0, 0, 50, undefined],
    };

    it('keeps datums with a null x/y on the node that was split, but not on its children', () => {
        const aggregation = aggregate(corners.xValues, corners.yValues);
        const root = aggregation.filters[0].node!;

        expect(root.children).toHaveLength(4);
        expect([...nodeIndices(aggregation, root)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);

        // Children are in quadrant order: low x/low y first, then high x, then high y.
        expect(root.children!.map((child) => nodeIndices(aggregation, child))).toEqual([[3], [2], [1], [0]]);
        expect(root.children!.map((child) => child.primaryDatumIndex)).toEqual([3, 2, 1, 0]);
        expect(root.children!.map((child) => child.children)).toEqual([null, null, null, null]);
    });

    it('picks the lowest datum index when several datums are equally close to the middle of a node', () => {
        const aggregation = aggregate(corners.xValues, corners.yValues);
        const root = aggregation.filters[0].node!;

        // All four corners are the same distance from (0.5, 0.5); datum 0 is the first of them in datum order,
        // though it is the last in the node's own range.
        expect(root.primaryDatumIndex).toBe(0);
    });

    it('counts and lists the datums with a null x/y when a split node is rendered as one group', () => {
        const aggregation = aggregate(corners.xValues, corners.yValues);

        const { groupedAggregation, singleDatumIndices } = computeBubbleAggregationData(4, aggregation, WALK);
        expect(singleDatumIndices).toEqual([]);
        expect(groupedAggregation).toHaveLength(1);
        const [group] = groupedAggregation;
        expect(group.datumIndex).toBe(0);
        expect(group.count).toBe(6);
        expect([...group.indices].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('lists the datums of unsplit leaves, skipping the ones with a null x/y', () => {
        const aggregation = aggregate(corners.xValues, corners.yValues);

        const { groupedAggregation, singleDatumIndices } = computeBubbleAggregationData(1, aggregation, WALK);
        expect(groupedAggregation).toEqual([]);
        expect([...singleDatumIndices].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
        expect(computeBubbleAggregationCount(1, aggregation, WALK)).toBe(4);
    });

    it('returns the only child of a node in place of the node itself', () => {
        // Four close datums share a quadrant, so the unit square has one child, and that child is what is returned:
        // the datums with a null x/y belong to the discarded parent, not to the node that is kept.
        const aggregation = aggregate([null, 10, 11, 11.4, 13, 50], [20, 10, 11, 11.4, 13, undefined]);
        const root = aggregation.filters[0].node!;

        expect(nodeIndices(aggregation, root)).toEqual([1, 2, 3, 4]);
        expect(root.children).toBeNull();
        expect(root.x0).toBeCloseTo(0.1, 12);
        expect(root.y0).toBeCloseTo(0.1, 12);
        expect(root.x1).toBeCloseTo(0.13, 12);
        expect(root.y1).toBeCloseTo(0.13, 12);
        expect(root.scale).toBeCloseTo(Math.hypot(0.03, 0.03), 12);
        // Nearest to the middle of the kept node (0.115), not of the unit square.
        expect(root.primaryDatumIndex).toBe(3);
    });

    it('collapses datums that are all equal into one leaf in datum order', () => {
        // A zero-width domain; the datums are the same distance from the middle, so the first is the primary.
        const xValues = Array.from({ length: 12 }, () => 5);
        const yValues = Array.from({ length: 12 }, () => 5);
        yValues[3] = null as any;

        const aggregation = aggregate(xValues, yValues, undefined, [5, 5]);
        const root = aggregation.filters[0].node!;

        expect(aggregation.xd1).toBeGreaterThan(aggregation.xd0);
        expect(nodeIndices(aggregation, root)).toEqual([0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11]);
        expect(root.children).toBeNull();
        expect([root.x0, root.y0, root.x1, root.y1, root.scale]).toEqual([0, 0, 0, 0, 0]);
        expect(root.primaryDatumIndex).toBe(0);
    });

    it('keeps a node holding only datums with a null x/y as an unsplit leaf', () => {
        const aggregation = aggregate([null, 3, null], [4, null, undefined]);
        const root = aggregation.filters[0].node!;

        expect(root.children).toBeNull();
        expect(nodeIndices(aggregation, root)).toEqual([0, 1, 2]);
        expect(root.primaryDatumIndex).toBe(0);
        expect(computeBubbleAggregationCount(1, aggregation, WALK)).toBe(3);
    });

    it('buckets datums by size in datum order, leaving out sizes outside the domain', () => {
        // One location, so each bucket is a single leaf: its range is exactly the datums of that bucket.
        const sizeValues = [60, 0, 80, 10, 40, 100, -50, Number.NaN, 20];
        const aggregation = aggregate(
            sizeValues.map(() => 50),
            sizeValues.map(() => 50),
            sizeValues,
            [0, 100],
            [0, 100]
        );

        expect(aggregation.filters.map((f) => f.sizeRatio)).toEqual([0, 1 / 3, 2 / 3]);
        expect(aggregation.filters.map((f) => nodeIndices(aggregation, f.node!))).toEqual([[1, 3, 8], [0, 4], [2]]);
        expect([...aggregation.indices].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 8]);
    });

    it('keeps a filter, with an empty node, for a size bucket no datum falls in', () => {
        const sizeValues = [1, 2, 3];
        const aggregation = aggregate([10, 20, 30], [10, 20, 30], sizeValues, [0, 100], [0, 100]);

        expect(aggregation.filters.map((f) => f.sizeRatio)).toEqual([0, 1 / 3, 2 / 3]);
        const [low, mid, high] = aggregation.filters.map((f) => f.node!);
        expect(nodeIndices(aggregation, low)).toEqual([0, 1, 2]);
        expect(nodeIndices(aggregation, mid)).toEqual([]);
        expect(nodeIndices(aggregation, high)).toEqual([]);
        expect(mid.children).toBeNull();
        expect(high.children).toBeNull();
    });

    it('reads the same datums for any walk, whatever order the nodes are visited in', () => {
        // Walking twice, and walking with a different dilation in between, must not disturb the shared buffer.
        const aggregation = aggregate(corners.xValues, corners.yValues);
        const before = Array.from(aggregation.indices);

        const first = computeBubbleAggregationData(4, aggregation, WALK);
        computeBubbleAggregationData(1, aggregation, WALK);
        computeBubbleAggregationCount(2, aggregation, WALK);
        const second = computeBubbleAggregationData(4, aggregation, WALK);

        expect(Array.from(aggregation.indices)).toEqual(before);
        expect(second.groupedAggregation.map((g) => [...g.indices])).toEqual(
            first.groupedAggregation.map((g) => [...g.indices])
        );
    });
});

describe('computeBubbleAggregation tree invariants', () => {
    // Checked against the data itself rather than a model of the algorithm: for every node, the bounds are those of
    // its datums, its children split exactly its non-null datums, and a leaf lists them in datum order.
    function lcg(seed: number) {
        let state = seed;
        return () => {
            state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    const cases: Array<[string, number, (r: () => number, i: number) => [number | null, number | null]]> = [
        ['scattered', 4000, (r) => [r() * 1000, r() * 1000]],
        ['scattered with gaps', 3000, (r, i) => [i % 11 === 0 ? null : r() * 50, i % 13 === 0 ? null : r() * 50]],
        ['clumped', 3000, (r, i) => (i % 3 === 0 ? [r() * 1000, r() * 1000] : [500 + r(), 500 + r()])],
        ['whole numbers', 3000, (r) => [Math.floor(r() * 10), Math.floor(r() * 10)]],
    ];

    it.each(cases)('%s', (_name, count, make) => {
        const r = lcg(count);
        const points = Array.from({ length: count }, (_, i) => make(r, i));
        const xValues = points.map((p) => p[0]);
        const yValues = points.map((p) => p[1]);
        const sizeValues = points.map(() => r() * 100);
        const aggregation = computeBubbleAggregation([0, 1000], [0, 1000], xValues, yValues, sizeValues, [0, 100], {
            xNeedsValueOf: false,
            yNeedsValueOf: false,
        })!;
        const { xd0, xd1, yd0, yd1 } = aggregation;
        const ratios = (i: number) => [
            aggregationXRatioForXValue(xValues[i], xd0, xd1, false),
            aggregationXRatioForXValue(yValues[i], yd0, yd1, false),
        ];
        const isPlotted = (i: number) => xValues[i] != null && yValues[i] != null;

        let leaves = 0;
        function check(node: BubbleAggregationNode, parent: BubbleAggregationNode | undefined) {
            const members = nodeIndices(aggregation, node);
            expect(new Set(members).size).toBe(members.length);
            if (parent != null) {
                expect(node.start).toBeGreaterThanOrEqual(parent.start);
                expect(node.end).toBeLessThanOrEqual(parent.end);
            }

            const plotted = members.filter(isPlotted);
            if (plotted.length > 0) {
                const xs = plotted.map((i) => ratios(i)[0]);
                const ys = plotted.map((i) => ratios(i)[1]);
                // A node split from the unit square keeps its own bounds there; below it, the bounds are tight.
                if (parent != null) {
                    expect([node.x0, node.y0, node.x1, node.y1]).toEqual([
                        Math.min(...xs),
                        Math.min(...ys),
                        Math.max(...xs),
                        Math.max(...ys),
                    ]);
                }
                expect(plotted).toContain(node.primaryDatumIndex);
            }
            expect(node.scale).toBe(Math.hypot(node.x1 - node.x0, node.y1 - node.y0));

            if (node.children == null) {
                leaves += 1;
                expect(members).toEqual([...members].sort((a, b) => a - b));
                return;
            }

            expect(node.children.length).toBeGreaterThan(1);
            const childMembers = node.children.flatMap((child) => nodeIndices(aggregation, child));
            expect([...childMembers].sort((a, b) => a - b)).toEqual([...plotted].sort((a, b) => a - b));
            for (const child of node.children) {
                check(child, node);
            }
        }

        // Each size bucket is a tree over the datums whose size falls in it.
        const bucketOf = (i: number) => Math.trunc((sizeValues[i] / 100) * SIZE_QUANTIZATION);
        for (const [i, { node }] of aggregation.filters.entries()) {
            const expected = Array.from({ length: count }, (_, d) => d).filter((d) => bucketOf(d) === i);
            const members = nodeIndices(aggregation, node!);
            expect([...members].sort((a, b) => a - b)).toEqual(
                node!.children == null ? expected : expected.filter(isPlotted)
            );
            check(node!, undefined);
        }
        expect(leaves).toBeGreaterThan(0);
    });
});
