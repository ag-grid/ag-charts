import { describe, expect, it } from 'vitest';

import { testLogger } from 'ag-charts-test';
import type { AgNumericValue } from 'ag-charts-types';

import { basicDataSet, categoryKey, resolveGroupColumn, scopedValue } from './data-model/test/testUtils';
import { DataModel } from './dataModel';
import type { ReducerOutputPropertyDefinition } from './dataModelTypes';
import { LARGEST_KEY_INTERVAL, SMALLEST_KEY_INTERVAL, accumulateGroup } from './processors';

function foldKeys(def: ReducerOutputPropertyDefinition<'smallestKeyInterval' | 'largestKeyInterval'>, keys: unknown[]) {
    const reduce = def.reducer();
    return keys.reduce<AgNumericValue | undefined>((acc, key) => reduce(acc, [key]), def.initialValue);
}

describe('interval reducers', () => {
    it('finds the smallest gap between number keys', () => {
        expect(foldKeys(SMALLEST_KEY_INTERVAL, [0, 10, 13, 100])).toBe(3);
    });

    it('finds the largest gap between number keys', () => {
        expect(foldKeys(LARGEST_KEY_INTERVAL, [0, 10, 13, 100])).toBe(87);
    });

    it('skips non-finite keys without disturbing the running predecessor', () => {
        expect(foldKeys(SMALLEST_KEY_INTERVAL, [0, Number.NaN, 5, Infinity, 6])).toBe(1);
    });

    it('measures Date-keyed gaps as elapsed milliseconds', () => {
        const t = Date.UTC(2024, 0, 1);
        expect(foldKeys(SMALLEST_KEY_INTERVAL, [new Date(t), new Date(t + 1000), new Date(t + 1500)])).toBe(500);
    });

    it('measures ISO 8601 string-keyed gaps as elapsed milliseconds', () => {
        const isoKeys = ['2024-01-01T00:00:00.000Z', '2024-01-01T00:00:01.000Z', '2024-01-01T00:00:01.500Z'];
        expect(foldKeys(SMALLEST_KEY_INTERVAL, isoKeys)).toBe(500);
        expect(foldKeys(LARGEST_KEY_INTERVAL, isoKeys)).toBe(1000);
    });

    // At 2^60 the gap is below the Number ULP (256), so coerce-then-subtract would collapse it to zero.
    it('preserves exact gaps between large-magnitude bigint keys', () => {
        const base = 2n ** 60n;
        expect(foldKeys(SMALLEST_KEY_INTERVAL, [base, base + 8n, base + 24n])).toBe(8n);
        expect(foldKeys(LARGEST_KEY_INTERVAL, [base, base + 8n, base + 24n])).toBe(16n);
    });
});

describe('interval reducer combiners', () => {
    it('SMALLEST_KEY_INTERVAL.combineResults ignores non-finite values', () => {
        const result = SMALLEST_KEY_INTERVAL.combineResults?.([Infinity, 5, Infinity, 2]);
        expect(result).toBe(2);
    });

    it('SMALLEST_KEY_INTERVAL.combineResults returns Infinity when all bands invalid', () => {
        const result = SMALLEST_KEY_INTERVAL.combineResults?.([Infinity, Infinity]);
        expect(result).toBe(Infinity);
    });

    it('LARGEST_KEY_INTERVAL.combineResults ignores non-finite values', () => {
        const result = LARGEST_KEY_INTERVAL.combineResults?.([-Infinity, 5, 10, -Infinity]);
        expect(result).toBe(10);
    });

    it('LARGEST_KEY_INTERVAL.combineResults returns -Infinity when all bands invalid', () => {
        const result = LARGEST_KEY_INTERVAL.combineResults?.([-Infinity, -Infinity]);
        expect(result).toBe(-Infinity);
    });
});

describe('accumulateGroup', () => {
    // Three stacked series over one key per row, with gaps and a mix of signs. A group where every series is
    // missing, or where only a later series has a value, must not inherit anything from the group before it.
    const rows = [
        { kp: 'Q1', a: 4, b: 6, c: 2 },
        { kp: 'Q2', a: -3, b: 5, c: -1 },
        { kp: 'Q3', a: undefined, b: undefined, c: 7 },
        { kp: 'Q4', a: 2, b: undefined, c: undefined },
        { kp: 'Q5', a: -1, b: -2, c: -3 },
    ];

    const stack = (
        data: Record<string, unknown>[],
        mode: 'normal' | 'trailing',
        separateNegative: boolean | undefined,
        // Merge rows with equal keys into one group, rather than one group per row.
        mergeEqualKeys = false
    ) => {
        const accumulate = { ...accumulateGroup('all', mode, separateNegative), scopes: ['test'] };
        const dataModel = new DataModel<any, any, true>(
            {
                props: [
                    categoryKey('kp'),
                    scopedValue('test', 'a', 'all'),
                    scopedValue('test', 'b', 'all'),
                    scopedValue('test', 'c', 'all'),
                    accumulate,
                ],
                groupByKeys: mergeEqualKeys ? undefined : true,
                groupByFn: mergeEqualKeys ? () => (keys) => [keys[0]] : undefined,
            },
            testLogger
        );

        const result = dataModel.processData(basicDataSet(data));
        if (result?.type !== 'grouped') throw new Error('expected grouped data');

        // One entry per group: each column's stacked values in that group.
        return result.groups.map((_, groupIndex) =>
            [0, 1, 2].map((column) => resolveGroupColumn(result, groupIndex, column))
        );
    };

    it('should stack each group from zero in column order, skipping missing values', () => {
        expect(stack(rows, 'normal', false)).toEqual([
            [[4], [10], [12]],
            [[-3], [2], [1]],
            [[undefined], [undefined], [7]],
            [[2], [undefined], [undefined]],
            [[-1], [-3], [-6]],
        ]);
    });

    it('should stack negative values separately from positive ones', () => {
        expect(stack(rows, 'normal', true)).toEqual([
            [[4], [10], [12]],
            [[-3], [5], [-4]],
            [[undefined], [undefined], [7]],
            [[2], [undefined], [undefined]],
            [[-1], [-3], [-6]],
        ]);
    });

    it('should hold the total below each value in trailing mode', () => {
        expect(stack(rows, 'trailing', false)).toEqual([
            [[0], [4], [10]],
            [[0], [-3], [2]],
            [[undefined], [undefined], [0]],
            [[0], [undefined], [undefined]],
            [[0], [-1], [-3]],
        ]);
    });

    it('should hold the total below each value per sign in trailing mode with separate negatives', () => {
        expect(stack(rows, 'trailing', true)).toEqual([
            [[0], [4], [10]],
            [[0], [0], [-3]],
            [[undefined], [undefined], [0]],
            [[0], [undefined], [undefined]],
            [[0], [-1], [-3]],
        ]);
    });

    it('should keep bigint totals exact across groups', () => {
        const bigRows = [
            { kp: 'Q1', a: 5n, b: -4n, c: 2n },
            { kp: 'Q2', a: -1n, b: 3n, c: undefined },
        ];

        expect(stack(bigRows, 'normal', false)).toEqual([
            [[5n], [1n], [3n]],
            [[-1n], [2n], [undefined]],
        ]);
        expect(stack(bigRows, 'normal', true)).toEqual([
            [[5n], [-4n], [7n]],
            [[-1n], [3n], [undefined]],
        ]);
    });

    it('should stack every datum of a group on the total below the group first datum', () => {
        const repeated = [
            { kp: 'Q1', a: 1, b: 2, c: 3 },
            { kp: 'Q1', a: 10, b: 20, c: 30 },
            { kp: 'Q2', a: 5, b: 7, c: 9 },
        ];

        expect(stack(repeated, 'normal', false, true)).toEqual([
            [
                [1, 10],
                [3, 21],
                [6, 33],
            ],
            [[5], [12], [21]],
        ]);
    });

    it('should stack the same data identically on repeated processing', () => {
        const first = stack(rows, 'normal', true);
        const second = stack(rows, 'normal', true);

        expect(second).toEqual(first);
    });
});
