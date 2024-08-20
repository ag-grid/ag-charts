import { iterate, toIterable } from './iterator';

describe('iterator utils', () => {
    describe('iterate generator function', () => {
        it('should iterate over multiple arrays', () => {
            const array1 = [1, 2];
            const array2 = ['a', 'b'];
            const array3 = [true, false];
            const combined = [1, 2, 'a', 'b', true, false];

            const iterator = iterate(array1, array2, array3);

            for (const value of combined) {
                expect(iterator.next().value).toBe(value);
            }
        });

        it('should complete iteration when all arrays are exhausted', () => {
            const array1 = [1];
            const array2 = ['a'];

            const iterator = iterate(array1, array2);
            iterator.next(); // 1
            iterator.next(); // 'a'

            expect(iterator.next().done).toBeTruthy();
        });

        it('should handle empty arrays correctly', () => {
            const array1: number[] = [];
            const array2 = [1, 2];
            const array3: number[] = [];

            const iterator = iterate(array1, array2, array3);

            expect(iterator.next().value).toBe(1);
            expect(iterator.next().value).toBe(2);
            expect(iterator.next().done).toBeTruthy();
        });

        it('should handle a single array', () => {
            const array1 = [1, 2, 3];

            const iterator = iterate(array1);

            expect(iterator.next().value).toBe(1);
            expect(iterator.next().value).toBe(2);
            expect(iterator.next().value).toBe(3);
            expect(iterator.next().done).toBeTruthy();
        });

        it('should handle no arrays', () => {
            const iterator = iterate();

            expect(iterator.next().done).toBeTruthy();
        });
    });

    describe('toIterable function', () => {
        it('should return the same iterable when given an iterable', () => {
            const array = [1, 2, 3];
            const iterable = toIterable(array);

            expect([...iterable]).toEqual([1, 2, 3]);
        });

        it('should wrap a non-iterable value in an iterable', () => {
            const value = 42;
            const iterable = toIterable(value);

            expect([...iterable]).toEqual([42]);
        });

        it('should handle null values correctly', () => {
            const value = null;
            const iterable = toIterable(value);

            expect([...iterable]).toEqual([null]);
        });

        it('should handle object values correctly by wrapping them in an array', () => {
            const value = { key: 'value' };
            const iterable = toIterable(value);

            expect([...iterable]).toEqual([{ key: 'value' }]);
        });
    });
});
