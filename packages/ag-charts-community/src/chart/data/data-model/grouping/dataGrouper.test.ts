import { describe, expect, it } from '@jest/globals';

import { DataModel } from '../../dataModel';
import { DataSet } from '../../dataSet';
import { categoryKey, scopedValue } from '../test/testUtils';

describe('DataGrouper', () => {
    describe('Column Batch Merging', () => {
        it('should merge batches with identical keys and invalidKeys', () => {
            const dataSet1 = new DataSet([
                { key: 1, valueA: 10 },
                { key: 2, valueA: 20 },
            ]);

            const dataSet2 = new DataSet([
                { key: 1, valueB: 100 },
                { key: 2, valueB: 200 },
            ]);

            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('key', ['scope1']),
                    categoryKey('key', ['scope2']),
                    scopedValue('scope1', 'valueA'),
                    scopedValue('scope2', 'valueB'),
                ],
                groupByKeys: true,
            });

            const data = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);

            const result = dataModel.processData(data);

            // Both scopes have the same keys [1, 2], so batches should be merged
            expect(result).toBeDefined();
            expect(result?.type).toBe('grouped');
            if (result?.type === 'grouped') {
                expect(result.groups).toHaveLength(2);
                // Verify that data from both scopes is present
                expect(result.groups[0].keys).toEqual([1]);
                expect(result.groups[1].keys).toEqual([2]);
            }
        });

        it('should not merge batches with different keys', () => {
            const dataSet1 = new DataSet([
                { key: 1, value: 10 },
                { key: 2, value: 20 },
            ]);

            const dataSet2 = new DataSet([
                { key: 3, value: 30 },
                { key: 4, value: 40 },
            ]);

            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('key', ['scope1']),
                    categoryKey('key', ['scope2']),
                    scopedValue('scope1', 'value'),
                    scopedValue('scope2', 'value'),
                ],
                groupByKeys: true,
            });

            const data = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);

            const result = dataModel.processData(data);

            // Different keys mean batches should NOT be merged
            expect(result).toBeDefined();
            expect(result?.type).toBe('grouped');
            if (result?.type === 'grouped') {
                // All 4 groups should be present
                expect(result.groups).toHaveLength(4);
            }
        });

        it('should handle edge case with undefined invalidData and invalidKeys', () => {
            const dataSet1 = new DataSet([
                { key: 1, value: 10 },
                { key: 2, value: 20 },
            ]);

            const dataSet2 = new DataSet([
                { key: 1, value: 100 },
                { key: 2, value: 200 },
            ]);

            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('key', ['scope1']),
                    categoryKey('key', ['scope2']),
                    scopedValue('scope1', 'value'),
                    scopedValue('scope2', 'value'),
                ],
                groupByKeys: true,
            });

            const data = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);

            const result = dataModel.processData(data);

            // All data is valid, so batches with same keys should merge cleanly
            expect(result).toBeDefined();
            expect(result?.type).toBe('grouped');
            if (result?.type === 'grouped') {
                expect(result.groups).toHaveLength(2);
                expect(result.groups[0].validScopes.size).toBeGreaterThan(0);
                expect(result.groups[1].validScopes.size).toBeGreaterThan(0);
            }
        });

        it('should merge batches with multiple columns per scope', () => {
            const dataSet1 = new DataSet([
                { key: 1, valueA1: 10, valueA2: 15 },
                { key: 2, valueA1: 20, valueA2: 25 },
            ]);

            const dataSet2 = new DataSet([
                { key: 1, valueB1: 100, valueB2: 150 },
                { key: 2, valueB1: 200, valueB2: 250 },
            ]);

            const dataModel = new DataModel<any, any, true>({
                props: [
                    categoryKey('key', ['scope1']),
                    categoryKey('key', ['scope2']),
                    scopedValue('scope1', 'valueA1'),
                    scopedValue('scope1', 'valueA2'),
                    scopedValue('scope2', 'valueB1'),
                    scopedValue('scope2', 'valueB2'),
                ],
                groupByKeys: true,
            });

            const data = new Map<string, DataSet<any>>([
                ['scope1', dataSet1],
                ['scope2', dataSet2],
            ]);

            const result = dataModel.processData(data);

            expect(result).toBeDefined();
            expect(result?.type).toBe('grouped');
            if (result?.type === 'grouped') {
                expect(result.groups).toHaveLength(2);
                // All groups should have both scopes as valid
                for (const group of result.groups) {
                    expect(group.validScopes.has('scope1')).toBe(true);
                    expect(group.validScopes.has('scope2')).toBe(true);
                }
                // Verify column count (2 value columns per scope = 4 total)
                expect(result.columns).toHaveLength(4);
            }
        });
    });
});
