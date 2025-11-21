import { computeAreaAggregation } from './areaAggregation';

describe('computeAreaAggregation', () => {
    describe('threshold behavior', () => {
        it('should return undefined for datasets below threshold (< 1000 points)', () => {
            const xValues = Array.from({ length: 999 }, (_, i) => i);
            const yValues = Array.from({ length: 999 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 998];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeUndefined();
        });

        it('should return aggregation filters for datasets at threshold (1000 points)', () => {
            const xValues = Array.from({ length: 1000 }, (_, i) => i);
            const yValues = Array.from({ length: 1000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should return aggregation filters for large datasets (> 1000 points)', () => {
            const xValues = Array.from({ length: 5000 }, (_, i) => i);
            const yValues = Array.from({ length: 5000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 4999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('multi-level filter generation', () => {
        it('should generate multiple filter levels ordered from coarse to fine', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const yValues = Array.from({ length: 10000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 9999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(1);

            // Verify filters are ordered from coarse (low maxRange) to fine (high maxRange)
            for (let i = 1; i < result!.length; i++) {
                expect(result![i].maxRange).toBeGreaterThan(result![i - 1].maxRange);
            }
        });

        it('should stop compacting when maxRange <= 64 OR indices <= 10', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const yValues = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 9999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            // The coarsest level should satisfy stop condition
            const coarsestLevel = result![0];
            const stopConditionMet = coarsestLevel.maxRange <= 64 || coarsestLevel.indices.length <= 10;
            expect(stopConditionMet).toBe(true);
        });
    });

    describe('metaIndices tracking', () => {
        it('should track group boundaries with metaIndices', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                expect(filter.metaIndices).toBeDefined();
                expect(Array.isArray(filter.metaIndices)).toBe(true);
                expect(filter.metaIndices.length).toBeGreaterThan(0);

                // metaIndices should be in ascending order
                for (let i = 1; i < filter.metaIndices.length; i++) {
                    expect(filter.metaIndices[i]).toBeGreaterThanOrEqual(filter.metaIndices[i - 1]);
                }
            }
        });

        it('should have metaIndices within indices range', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                for (const metaIndex of filter.metaIndices) {
                    expect(metaIndex).toBeGreaterThanOrEqual(0);
                    expect(metaIndex).toBeLessThanOrEqual(filter.indices.length - 1);
                }
            }
        });

        it('should end metaIndices with last index position', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                const lastMetaIndex = filter.metaIndices.at(-1);
                expect(lastMetaIndex).toBe(filter.indices.length - 1);
            }
        });
    });

    describe('extrema correctness', () => {
        it('should include extrema points in aggregation', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                expect(filter.indices.length).toBeGreaterThan(0);

                // All indices should be valid
                for (const index of filter.indices) {
                    expect(index).toBeGreaterThanOrEqual(0);
                    expect(index).toBeLessThan(xValues.length);
                }
            }
        });

        it('should handle monotonically increasing data', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle monotonically decreasing data', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => 2000 - i);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('edge cases', () => {
        it('should handle uniform Y values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, () => 42);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle zero values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, () => 0);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
        });

        it('should handle negative values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => -Math.abs(Math.sin(i / 10) * 100));
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle mixed positive and negative values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle NaN domain (categorical X axis)', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => `category-${i}`);
            const yValues = Array.from({ length: 2000 }, (_, i) => i);
            const domain: [number, number] = [Number.NaN, Number.NaN];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            // Should still work with categorical X axis (uses indices)
        });
    });

    describe('valueOf conversion flags', () => {
        it('should handle xNeedsValueOf = true for Date objects', () => {
            const startDate = new Date('2020-01-01').getTime();
            const xValues = Array.from({ length: 2000 }, (_, i) => new Date(startDate + i * 86400000));
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [startDate, startDate + 1999 * 86400000];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: true,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle yNeedsValueOf = true for wrapped values', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => ({ valueOf: () => i * 10 }));
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: true,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });

        it('should handle both xNeedsValueOf and yNeedsValueOf = true', () => {
            const startDate = new Date('2020-01-01').getTime();
            const xValues = Array.from({ length: 2000 }, (_, i) => new Date(startDate + i * 86400000));
            const yValues = Array.from({ length: 2000 }, (_, i) => ({ valueOf: () => i * 10 }));
            const domain: [number, number] = [startDate, startDate + 1999 * 86400000];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: true,
                yNeedsValueOf: true,
            });

            expect(result).toBeDefined();
            expect(result!.length).toBeGreaterThan(0);
        });
    });

    describe('filter structure', () => {
        it('should return filters with correct structure', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                expect(filter).toHaveProperty('maxRange');
                expect(filter).toHaveProperty('metaIndices');
                expect(filter).toHaveProperty('indices');

                expect(typeof filter.maxRange).toBe('number');
                expect(filter.maxRange).toBeGreaterThan(0);

                expect(Array.isArray(filter.metaIndices)).toBe(true);
                expect(Array.isArray(filter.indices)).toBe(true);
            }
        });

        it('should have indices pointing to valid data positions', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                for (const index of filter.indices) {
                    expect(index).toBeGreaterThanOrEqual(0);
                    expect(index).toBeLessThan(xValues.length);
                }
            }
        });

        it('should have consistent indices and metaIndices relationship', () => {
            const xValues = Array.from({ length: 2000 }, (_, i) => i);
            const yValues = Array.from({ length: 2000 }, (_, i) => i * 10);
            const domain: [number, number] = [0, 1999];

            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });

            expect(result).toBeDefined();

            for (const filter of result!) {
                // metaIndices should reference positions in the indices array
                expect(filter.metaIndices.length).toBeGreaterThan(0);
                expect(filter.metaIndices.length).toBeLessThanOrEqual(filter.indices.length);

                // Each metaIndex should be a valid index position
                for (const metaIndex of filter.metaIndices) {
                    expect(filter.indices[metaIndex]).toBeDefined();
                }
            }
        });
    });

    describe('performance characteristics', () => {
        it('should handle 10k points efficiently', () => {
            const xValues = Array.from({ length: 10000 }, (_, i) => i);
            const yValues = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 9999];

            const start = performance.now();
            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });
            const duration = performance.now() - start;

            expect(result).toBeDefined();
            expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
        });

        it('should handle 100k points efficiently', () => {
            const xValues = Array.from({ length: 100000 }, (_, i) => i);
            const yValues = Array.from({ length: 100000 }, (_, i) => Math.sin(i / 10) * 100);
            const domain: [number, number] = [0, 99999];

            const start = performance.now();
            const result = computeAreaAggregation(domain, xValues, yValues, {
                xNeedsValueOf: false,
                yNeedsValueOf: false,
            });
            const duration = performance.now() - start;

            expect(result).toBeDefined();
            expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
        });
    });
});
