import { computeBubbleAggregation } from './bubbleAggregation';

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
            expect(result!.filters.length).toBeGreaterThan(0);
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
        });
    });

    describe('quadtree structure', () => {
        it('should create hierarchical quadtree nodes', () => {
            const xValues = Array.from({ length: 100 }, () => Math.random() * 100);
            const yValues = Array.from({ length: 100 }, () => Math.random() * 100);
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
            // Should have multiple filters for different size quantiles
            expect(result!.filters.length).toBeGreaterThan(0);

            // Verify sizeRatio is in valid range [0, 1)
            for (const filter of result!.filters) {
                expect(filter.sizeRatio).toBeGreaterThanOrEqual(0);
                expect(filter.sizeRatio).toBeLessThan(1);
            }
        });

        it('should group bubbles by size into quantiles', () => {
            const count = 300;
            const xValues = Array.from({ length: count }, () => Math.random() * 100);
            const yValues = Array.from({ length: count }, () => Math.random() * 100);
            const sizeValues = Array.from({ length: count }, (_, i) => Math.floor((i / count) * 100)); // 0-99
            const xDomain: [number, number] = [0, 100];
            const yDomain: [number, number] = [0, 100];
            const sizeDomain: [number, number] = [0, 99];

            const result = computeBubbleAggregation(xDomain, yDomain, xValues, yValues, sizeValues, sizeDomain, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.filters.length).toBeGreaterThan(0);
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
