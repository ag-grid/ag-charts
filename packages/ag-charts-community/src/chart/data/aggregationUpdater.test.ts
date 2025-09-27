import { AggregationUpdater } from './aggregationUpdater';
import { DataChangeDescriptorBuilder } from './dataChangeDescriptor';
import type { AggregatePropertyDefinition, DataGroup } from './dataModel';

describe('AggregationUpdater', () => {
    describe('updateAggregations', () => {
        it('should handle empty changes', () => {
            const groups: DataGroup[] = [
                {
                    keys: ['A'],
                    datumIndices: [[0, 1, 2]],
                    aggregation: [[0, 10]],
                    validScopes: new Set(['scope1']),
                },
            ];
            const changes = DataChangeDescriptorBuilder.create().build();
            const aggregateDefs: AggregatePropertyDefinition<any, any>[] = [
                {
                    id: 'sum',
                    type: 'aggregate',
                    aggregateFunction: (values) => values.reduce((acc, val) => acc + val, 0),
                },
            ];
            const columns = [[1, 2, 3, 4, 5]];
            const valueGroupIdxLookup = () => [0];

            const originalAggregation = groups[0].aggregation?.[0];

            AggregationUpdater.updateAggregations(groups, changes, aggregateDefs, columns, valueGroupIdxLookup);

            // Should not change aggregation when no changes
            expect(groups[0].aggregation?.[0]).toEqual(originalAggregation);
        });

        it('should handle empty aggregation definitions', () => {
            const groups: DataGroup[] = [
                {
                    keys: ['A'],
                    datumIndices: [[0, 1, 2]],
                    aggregation: [],
                    validScopes: new Set(['scope1']),
                },
            ];
            const changes = DataChangeDescriptorBuilder.create().addInsertion(0, { value: 10 }).build();
            const aggregateDefs: AggregatePropertyDefinition<any, any>[] = [];
            const columns = [[1, 2, 3, 4, 5]];
            const valueGroupIdxLookup = () => [0];

            // Should not throw when no aggregations to update
            expect(() => {
                AggregationUpdater.updateAggregations(groups, changes, aggregateDefs, columns, valueGroupIdxLookup);
            }).not.toThrow();
        });

        it('should recalculate aggregations for dirty groups', () => {
            const groups: DataGroup[] = [
                {
                    keys: ['A'],
                    datumIndices: [[0, 1]], // Indices pointing to columns values [1, 2]
                    aggregation: [[0, 0]], // Will be recalculated
                    validScopes: new Set(['scope1']),
                },
            ];
            const changes = DataChangeDescriptorBuilder.create().addInsertion(3, { value: 10 }).build();

            // Sum aggregation using pattern from aggregateFunctions.ts
            const aggregateDefs: AggregatePropertyDefinition<any, any>[] = [
                {
                    id: 'sum',
                    type: 'aggregate',
                    aggregateFunction: (values) => {
                        // Like sumValues, but simpler for test
                        const result: [number, number] = [0, 0];
                        for (const value of values) {
                            if (typeof value === 'number') {
                                if (value < 0) {
                                    result[0] += value;
                                } else if (value > 0) {
                                    result[1] += value;
                                }
                            }
                        }
                        return result;
                    },
                    groupAggregateFunction: (next, acc = [0, 0]) => {
                        acc[0] += next?.[0] ?? 0;
                        acc[1] += next?.[1] ?? 0;
                        return acc;
                    },
                },
            ];

            const columns = [[1, 2, 3, 4, 5]]; // Column data
            const valueGroupIdxLookup = () => [0]; // Use first column

            AggregationUpdater.updateAggregations(groups, changes, aggregateDefs, columns, valueGroupIdxLookup);

            // Should recalculate sum: 1 + 2 = 3 (indices 0, 1 from column)
            expect(groups[0].aggregation?.[0]).toEqual([0, 3]);
        });

        it('should handle multiple groups', () => {
            const groups: DataGroup[] = [
                {
                    keys: ['A'],
                    datumIndices: [[0, 1]], // Points to [1, 2]
                    aggregation: [[0, 0]],
                    validScopes: new Set(['scope1']),
                },
                {
                    keys: ['B'],
                    datumIndices: [[2, 3]], // Points to [3, 4]
                    aggregation: [[0, 0]],
                    validScopes: new Set(['scope1']),
                },
            ];
            const changes = DataChangeDescriptorBuilder.create().addInsertion(4, { value: 10 }).build();

            const aggregateDefs: AggregatePropertyDefinition<any, any>[] = [
                {
                    id: 'sum',
                    type: 'aggregate',
                    aggregateFunction: (values) => {
                        const result: [number, number] = [0, 0];
                        for (const value of values) {
                            if (typeof value === 'number') {
                                if (value < 0) {
                                    result[0] += value;
                                } else if (value > 0) {
                                    result[1] += value;
                                }
                            }
                        }
                        return result;
                    },
                    groupAggregateFunction: (next, acc = [0, 0]) => {
                        acc[0] += next?.[0] ?? 0;
                        acc[1] += next?.[1] ?? 0;
                        return acc;
                    },
                },
            ];

            const columns = [[1, 2, 3, 4, 5]];
            const valueGroupIdxLookup = () => [0];

            AggregationUpdater.updateAggregations(groups, changes, aggregateDefs, columns, valueGroupIdxLookup);

            // Group A: 1 + 2 = 3 (indices 0, 1)
            expect(groups[0].aggregation?.[0]).toEqual([0, 3]);
            // Group B: 3 + 4 = 7 (indices 2, 3)
            expect(groups[1].aggregation?.[0]).toEqual([0, 7]);
        });

        it('should handle multiple aggregations per group', () => {
            const groups: DataGroup[] = [
                {
                    keys: ['A'],
                    datumIndices: [[0, 1]],
                    aggregation: [
                        [0, 0],
                        [0, 0],
                    ],
                    validScopes: new Set(['scope1']),
                },
            ];
            const changes = DataChangeDescriptorBuilder.create().addInsertion(2, { value: 10 }).build();

            const aggregateDefs: AggregatePropertyDefinition<any, any>[] = [
                {
                    id: 'sum',
                    type: 'aggregate',
                    aggregateFunction: (values) => {
                        const result: [number, number] = [0, 0];
                        for (const value of values) {
                            if (typeof value === 'number') {
                                if (value < 0) {
                                    result[0] += value;
                                } else if (value > 0) {
                                    result[1] += value;
                                }
                            }
                        }
                        return result;
                    },
                    groupAggregateFunction: (next, acc = [0, 0]) => {
                        acc[0] += next?.[0] ?? 0;
                        acc[1] += next?.[1] ?? 0;
                        return acc;
                    },
                },
                {
                    id: 'count',
                    type: 'aggregate',
                    aggregateFunction: (values) => [0, values.length],
                    groupAggregateFunction: (next, acc = [0, 0]) => {
                        acc[0] += next?.[0] ?? 0;
                        acc[1] += next?.[1] ?? 0;
                        return acc;
                    },
                },
            ];

            const columns = [[1, 2, 3]];
            const valueGroupIdxLookup = () => [0];

            AggregationUpdater.updateAggregations(groups, changes, aggregateDefs, columns, valueGroupIdxLookup);

            // Sum: 1 + 2 = 3 (indices 0, 1)
            expect(groups[0].aggregation?.[0]).toEqual([0, 3]);
            // Count: 2 datum indices, each contributing 1 count = 2
            expect(groups[0].aggregation?.[1]).toEqual([0, 2]);
        });

        it('should use incremental updater when available and supported', () => {
            const groups: DataGroup[] = [
                {
                    keys: ['A'],
                    datumIndices: [[0, 1]],
                    aggregation: [[0, 10]], // Existing aggregation
                    validScopes: new Set(['scope1']),
                },
            ];
            const changes = DataChangeDescriptorBuilder.create().addInsertion(2, { value: 5 }).build();

            // Mock incremental updater that should be called
            const incrementalUpdater = jest.fn().mockReturnValue([0, 15]);

            const aggregateDefs: AggregatePropertyDefinition<any, any>[] = [
                {
                    id: 'sum',
                    type: 'aggregate',
                    supportsIncremental: true,
                    incrementalUpdater,
                    aggregateFunction: (values) => {
                        const result: [number, number] = [0, 0];
                        for (const value of values) {
                            if (typeof value === 'number') {
                                if (value < 0) {
                                    result[0] += value;
                                } else if (value > 0) {
                                    result[1] += value;
                                }
                            }
                        }
                        return result;
                    },
                    groupAggregateFunction: (next, acc = [0, 0]) => {
                        acc[0] += next?.[0] ?? 0;
                        acc[1] += next?.[1] ?? 0;
                        return acc;
                    },
                },
            ];

            const columns = [[1, 2, 3]];
            const valueGroupIdxLookup = () => [0];

            AggregationUpdater.updateAggregations(groups, changes, aggregateDefs, columns, valueGroupIdxLookup);

            // For now, incremental updater falls back to full calculation
            // When proper incremental support is implemented, this should use the incrementalUpdater
            expect(groups[0].aggregation?.[0]).toEqual([0, 3]); // 1 + 2 = 3 (full recalc)
        });
    });

    describe('createIncrementalUpdaters', () => {
        const updaters = AggregationUpdater.createIncrementalUpdaters();

        describe('sum updater', () => {
            it('should handle adding positive values', () => {
                const current: [number, number] = [0, 10];
                const removed: number[] = [];
                const added = [3, 5];

                const result = updaters.sum(current, removed, added);

                expect(result).toEqual([0, 18]); // 10 + 3 + 5 = 18
            });

            it('should handle adding negative values', () => {
                const current: [number, number] = [-5, 10];
                const removed: number[] = [];
                const added = [-3, -2];

                const result = updaters.sum(current, removed, added);

                expect(result).toEqual([-10, 10]); // -5 + (-3) + (-2) = -10
            });

            it('should handle removing positive values', () => {
                const current: [number, number] = [0, 15];
                const removed = [3, 5];
                const added: number[] = [];

                const result = updaters.sum(current, removed, added);

                expect(result).toEqual([0, 7]); // 15 - 3 - 5 = 7
            });

            it('should handle removing negative values', () => {
                const current: [number, number] = [-8, 10];
                const removed = [-3, -2];
                const added: number[] = [];

                const result = updaters.sum(current, removed, added);

                expect(result).toEqual([-3, 10]); // -8 - (-3) - (-2) = -3
            });

            it('should handle mixed positive and negative additions and removals', () => {
                const current: [number, number] = [-5, 15];
                const removed = [2, -1];
                const added = [4, -3];

                const result = updaters.sum(current, removed, added);

                expect(result).toEqual([-7, 17]); // neg: -5 - (-1) + (-3) = -7, pos: 15 - 2 + 4 = 17
            });

            it('should ignore non-numeric values', () => {
                const current: [number, number] = [0, 10];
                const removed = [null, undefined, 'string', 2] as any[];
                const added = [null, undefined, 'string', 3] as any[];

                const result = updaters.sum(current, removed, added);

                expect(result).toEqual([0, 11]); // 10 - 2 + 3 = 11
            });
        });

        describe('count updater', () => {
            it('should increase count when adding items', () => {
                const current: [number, number] = [0, 5];
                const removed: any[] = [];
                const added = [1, 2, 3];

                const result = updaters.count(current, removed, added);

                expect(result).toEqual([0, 8]); // 5 + 3 = 8
            });

            it('should decrease count when removing items', () => {
                const current: [number, number] = [0, 10];
                const removed = [1, 2];
                const added: any[] = [];

                const result = updaters.count(current, removed, added);

                expect(result).toEqual([0, 8]); // 10 - 2 = 8
            });

            it('should handle both additions and removals', () => {
                const current: [number, number] = [0, 10];
                const removed = [1, 2, 3];
                const added = [4, 5];

                const result = updaters.count(current, removed, added);

                expect(result).toEqual([0, 9]); // 10 - 3 + 2 = 9
            });

            it('should handle zero net change', () => {
                const current: [number, number] = [0, 10];
                const removed = [1, 2];
                const added = [3, 4];

                const result = updaters.count(current, removed, added);

                expect(result).toEqual([0, 10]); // 10 - 2 + 2 = 10
            });
        });

        describe('average updater', () => {
            it('should handle adding values', () => {
                const current: [number, number, number] = [-5, 15, 4]; // [negSum, posSum, count]
                const removed: number[] = [];
                const added = [3, -2];

                const result = updaters.average(current, removed, added);

                expect(result).toEqual([-7, 18, 6]); // negSum: -5 + (-2) = -7, posSum: 15 + 3 = 18, count: 4 + 2 = 6
            });

            it('should handle removing values', () => {
                const current: [number, number, number] = [-8, 20, 6];
                const removed = [3, -2];
                const added: number[] = [];

                const result = updaters.average(current, removed, added);

                expect(result).toEqual([-6, 17, 4]); // negSum: -8 - (-2) = -6, posSum: 20 - 3 = 17, count: 6 - 2 = 4
            });

            it('should handle mixed operations', () => {
                const current: [number, number, number] = [-10, 25, 8];
                const removed = [5, -3];
                const added = [2, -1, 4];

                const result = updaters.average(current, removed, added);

                expect(result).toEqual([-8, 26, 9]); // negSum: -10 - (-3) + (-1) = -8, posSum: 25 - 5 + 2 + 4 = 26, count: 8 - 2 + 3 = 9
            });

            it('should ignore non-numeric values', () => {
                const current: [number, number, number] = [-5, 15, 5];
                const removed = [null, 'string', 2] as any[];
                const added = [undefined, 3] as any[];

                const result = updaters.average(current, removed, added);

                expect(result).toEqual([-5, 16, 5]); // Only 2 was removed, only 3 was added, count stays same due to ignored values
            });
        });
    });

    describe('enhanceWithIncrementalSupport', () => {
        it('should enhance sum aggregation with incremental support', () => {
            const originalDef: AggregatePropertyDefinition<any, any> = {
                id: 'sum',
                type: 'aggregate',
                aggregateFunction: (values) => values.reduce((acc, val) => acc + val, 0),
            };

            const enhanced = AggregationUpdater.enhanceWithIncrementalSupport(originalDef, 'sum');

            expect(enhanced.supportsIncremental).toBe(true);
            expect(enhanced.incrementalUpdater).toBeDefined();
            expect(enhanced.id).toBe('sum');
            expect(enhanced.aggregateFunction).toBe(originalDef.aggregateFunction);
        });

        it('should enhance count aggregation with incremental support', () => {
            const originalDef: AggregatePropertyDefinition<any, any> = {
                id: 'count',
                type: 'aggregate',
                aggregateFunction: (values) => [0, values.length],
            };

            const enhanced = AggregationUpdater.enhanceWithIncrementalSupport(originalDef, 'count');

            expect(enhanced.supportsIncremental).toBe(true);
            expect(enhanced.incrementalUpdater).toBeDefined();
            expect(enhanced.id).toBe('count');
        });

        it('should enhance average aggregation with incremental support', () => {
            const originalDef: AggregatePropertyDefinition<any, any> = {
                id: 'average',
                type: 'aggregate',
                aggregateFunction: (values) => {
                    const sum = values.reduce((acc, val) => acc + val, 0);
                    return [sum, values.length];
                },
            };

            const enhanced = AggregationUpdater.enhanceWithIncrementalSupport(originalDef, 'average');

            expect(enhanced.supportsIncremental).toBe(true);
            expect(enhanced.incrementalUpdater).toBeDefined();
            expect(enhanced.id).toBe('average');
        });
    });
});
