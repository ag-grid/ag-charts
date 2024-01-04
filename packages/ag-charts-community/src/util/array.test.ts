import { describe, expect, test } from '@jest/globals';

import { arraysEqual, extent } from './array';

describe('array module', () => {
    describe('extent with isContinuous', () => {
        test('returns lowest and highest numbers from list of numbers', () => {
            {
                const result = extent([3, 7, 1, 2, 9, -2]);
                expect(result?.[0]).toBe(-2);
                expect(result?.[1]).toBe(9);
            }
            {
                const result = extent([0, 13, 10, 19]);
                expect(result?.[0]).toBe(0);
                expect(result?.[1]).toBe(19);
            }
            {
                const result = extent([null as any, 0, 13, 10, 19]);
                expect(result?.[0]).toBe(0);
                expect(result?.[1]).toBe(19);
            }
        });

        test('returns undefined for list of invalid values', () => {
            const result = extent([NaN, null, undefined] as any[]);
            expect(result).toBe(undefined);
        });

        test('returns undefined for empty list', () => {
            const result = extent([]);
            expect(result).toBe(undefined);
        });

        test('returns same lowest and highest number for single number', () => {
            const result = extent([5]);
            expect(result?.[0]).toBe(5);
            expect(result?.[1]).toBe(5);
        });

        test('returns valid lowest and highest number from mixed values', () => {
            const result = extent([undefined, 4, 3, 7, null, {}, 1, 5] as any);
            expect(result?.[0]).toBe(1);
            expect(result?.[1]).toBe(7);
        });

        test('does not coerce objects', () => {
            const result = extent([{ toString: () => '2' }, { toString: () => '1' }] as any);
            expect(result).toBe(undefined);
        });

        test('coerces Dates to numbers', () => {
            const earliest = 5270400000;
            const latest = 1568332800000;

            const result = extent(
                [new Date(earliest), new Date(latest), new Date(1985, 5, 5)].map((d) => d.getTime())
            )!.map((x) => Number(x));

            expect(result?.[0]).toBe(earliest);
            expect(result?.[1]).toBe(latest);
        });

        test('returns earliest and latest timestamp for mixed Dates and numbers', () => {
            const earliest = 5270400000;
            const latest = 1568468277000;

            const result = extent([new Date(2019, 7, 20), new Date(earliest), latest, new Date(1985, 5, 5)])!.map((x) =>
                Number(x)
            );

            expect(result?.[0]).toBe(earliest);
            expect(result?.[1]).toBe(latest);
        });
    });

    describe('arraysEqual util', () => {
        test('returns expected result with simple arrays', () => {
            expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(arraysEqual([1, 2, 3], [3, 2, 1])).toBe(false);
            expect(arraysEqual([[1], 2, 3], [[1], 2, 4]));
        });

        test('returns expected result with nested arrays', () => {
            expect(arraysEqual([[1], 2, 3], [[1], 2, 4])).toBe(false);
            expect(arraysEqual([[1], 2, [[3]]], [[1], 2, [[3]]])).toBe(true);
        });

        test('returns expected result with different size array', () => {
            expect(arraysEqual([1, 2, 3], [1, 2])).toBe(false);
            expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false);
        });
    });
});
