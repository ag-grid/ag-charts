import { findMaxIndex, findMaxValue, findMinIndex, findMinValue } from './binarySearch';

describe('Binary Search Utilities', () => {
    describe('findMaxIndex', () => {
        it('finds the maximum index satisfying the condition', () => {
            expect(findMaxIndex(0, 10, (x) => x <= 7)).toBe(7);
            expect(findMaxIndex(0, 10, (x) => x <= 3)).toBe(3);
        });

        it('returns undefined if no index satisfies the condition', () => {
            expect(findMaxIndex(0, 10, (x) => x < 0)).toBeUndefined();
        });
    });

    describe('findMinIndex', () => {
        it('finds the minimum index satisfying the condition', () => {
            expect(findMinIndex(0, 10, (x) => x >= 3)).toBe(3);
            expect(findMinIndex(0, 10, (x) => x >= 7)).toBe(7);
        });

        it('returns undefined if no index satisfies the condition', () => {
            expect(findMinIndex(0, 10, (x) => x > 10)).toBeUndefined();
        });
    });

    describe('findMaxValue', () => {
        it('finds the maximum value satisfying the condition', () => {
            expect(findMaxValue(0, 10, (x) => (x <= 7 ? x : undefined))).toBe(7);
            expect(findMaxValue(0, 10, (x) => (x <= 2 ? x : undefined))).toBe(2);
        });

        it('returns undefined if no value satisfies the condition', () => {
            expect(findMaxValue(0, 10, (_x) => undefined)).toBeUndefined();
        });
    });

    describe('findMinValue', () => {
        it('finds the minimum value satisfying the condition', () => {
            expect(findMinValue(0, 10, (x) => (x >= 3 ? x : undefined))).toBe(3);
            expect(findMinValue(0, 10, (x) => (x >= 7 ? x : undefined))).toBe(7);
        });

        it('returns undefined if no value satisfies the condition', () => {
            expect(findMinValue(0, 10, (_x) => undefined)).toBeUndefined();
        });
    });
});
