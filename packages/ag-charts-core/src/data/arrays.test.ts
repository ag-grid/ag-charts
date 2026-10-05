import { arraysEqual, circularSliceArray, distribute, groupBy, sortBasedOnArray, toArray, unique } from './arrays';

describe('Arrays Utilities', () => {
    describe('toArray', () => {
        it('converts a single value to an array', () => {
            expect(toArray(5)).toEqual([5]);
        });

        it('returns an array as-is', () => {
            expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
        });

        it('returns an empty array for undefined', () => {
            expect(toArray(undefined)).toEqual([]);
        });
    });

    describe('unique', () => {
        it('removes duplicate values from an array', () => {
            expect(unique([1, 2, 2, 3, 4, 4])).toEqual([1, 2, 3, 4]);
        });

        it('returns an empty array when input is empty', () => {
            expect(unique([])).toEqual([]);
        });
    });

    describe('groupBy', () => {
        it('groups items by the iteratee function', () => {
            const data = [
                { category: 'fruit', name: 'apple' },
                { category: 'fruit', name: 'banana' },
                { category: 'vegetable', name: 'carrot' },
            ];

            expect(groupBy(data, (item) => item.category)).toEqual({
                fruit: [
                    { category: 'fruit', name: 'apple' },
                    { category: 'fruit', name: 'banana' },
                ],
                vegetable: [{ category: 'vegetable', name: 'carrot' }],
            });
        });

        it('returns an empty object when input is empty', () => {
            expect(groupBy([], (item) => item)).toEqual({});
        });
    });

    describe('arraysEqual', () => {
        it('returns true for deeply equal arrays', () => {
            expect(arraysEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
        });

        it('returns false for arrays with different structures', () => {
            expect(arraysEqual([1, [2]], [1, [2, 3]])).toBe(false);
        });

        it('returns false for arrays with different values', () => {
            expect(arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
        });
    });

    describe('circularSliceArray', () => {
        it('creates a circular slice of an array', () => {
            expect(circularSliceArray([1, 2, 3], 5)).toEqual([1, 2, 3, 1, 2]);
        });

        it('creates a slice with an offset', () => {
            expect(circularSliceArray([1, 2, 3], 5, 1)).toEqual([2, 3, 1, 2, 3]);
        });

        it('returns an empty array when input is empty', () => {
            expect(circularSliceArray([], 3)).toEqual([]);
        });
    });

    describe('sortBasedOnArray', () => {
        it('sorts a base array based on a reference array', () => {
            expect(sortBasedOnArray(['b', 'a', 'c'], ['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
        });

        it('places elements not in the reference array at the end', () => {
            expect(sortBasedOnArray(['d', 'b', 'a', 'c'], ['a', 'b', 'c'])).toEqual(['a', 'b', 'c', 'd']);
        });

        it('returns an empty array when the base array is empty', () => {
            expect(sortBasedOnArray([], ['a', 'b', 'c'])).toEqual([]);
        });
    });

    it('distribute', () => {
        expect(distribute(0, 3, 5)).toEqual([0, 1, 2, 3]);
        expect(distribute(0, 4, 5)).toEqual([0, 1, 2, 3, 4]);
        expect(distribute(0, 5, 5)).toEqual([0, 1, 2, 3, 5]);
        expect(distribute(0, 6, 5)).toEqual([0, 2, 4, 6]);
        expect(distribute(0, 2000, 5)).toEqual([0, 500, 1000, 1500, 2000]);
    });
});
