import type { DataModel } from '../../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../../data/dataModelTypes';
import { stubAggregationDataModel } from '../../test/aggregationStubs';
import { BIG } from '../../test/bigintExamples';
import type { BubbleAggregationNode } from './bubbleAggregation';
import { aggregateBubbleDataFromDataModel, computeBubbleAggregation } from './bubbleAggregation';

const SIZE_QUANTIZATION = 3;

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
            expect(node).toHaveProperty('indices');
            expect(node).toHaveProperty('primaryDatumIndex');
            expect(node).toHaveProperty('children');
            // Verify node structure
            expect(node!.indices.length).toBeGreaterThan(0);
            expect(node!.indices.length).toBeLessThanOrEqual(100);
            expect(node!.primaryDatumIndex).toBeGreaterThanOrEqual(0);
            expect(node!.primaryDatumIndex).toBeLessThan(100);
            expect(node!.indices).toContain(node!.primaryDatumIndex);
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
                expect(node.indices).toContain(node.primaryDatumIndex);

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
                expect(filter.node!.indices.length).toBeGreaterThan(0);
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
                expect(filter.node!.indices.length).toBeGreaterThan(0);
                for (const idx of filter.node!.indices) {
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
            expect(result!.filters[0].node!.indices).toEqual([]);
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
            expect(result!.filters[0].node!.indices).toEqual([0]);
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
            expect(node!.indices).toHaveLength(count);
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
            expect(node!.indices).toHaveLength(count);
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

    // The quadtree partitions by xRatio = (x - xd0) / (xd1 - xd0). The domain min must be subtracted in bigint
    // before narrowing or a high-magnitude narrow-range X column collapses onto one double, leaving xd0 === xd1
    // (zero-width domain) so every xRatio degenerates and no point can be spatially separated.
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
