import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import { createUniqueIds } from './id';

describe('id util', () => {
    beforeEach(() => {
        console.warn = jest.fn();
    });

    const duplicate = (firstIndex: number, duplicateIndex: number) => {
        return { firstIndex, duplicateIndex };
    };

    describe('createUniqueIds', () => {
        test('empty array', () => {
            const { uniqueIds, duplicates } = createUniqueIds([]);
            expect(uniqueIds).toStrictEqual([]);
            expect(duplicates).toStrictEqual([]);
        });

        test('no duplicates', () => {
            const { uniqueIds, duplicates } = createUniqueIds(['a', 'b', 'c', 'd']);
            expect(uniqueIds).toStrictEqual(['a', 'b', 'c', 'd']);
            expect(duplicates).toStrictEqual([]);
        });

        test('all duplicates', () => {
            const { uniqueIds, duplicates } = createUniqueIds(['k', 'k', 'k', 'k']);
            expect(uniqueIds).toStrictEqual(['k', 'k-2', 'k-3', 'k-4']);
            expect(duplicates).toStrictEqual([1, 2, 3].map((i) => duplicate(0, i)));
        });

        test('two duplicates', () => {
            const { uniqueIds, duplicates } = createUniqueIds(['a', 'b', 'a', 'b', 'b', 'c']);
            expect(uniqueIds).toStrictEqual(['a', 'b', 'a-2', 'b-2', 'b-3', 'c']);
            expect(duplicates).toStrictEqual([duplicate(0, 2), duplicate(1, 3), duplicate(1, 4)]);
        });

        test('undefined values', () => {
            const { uniqueIds, duplicates } = createUniqueIds(['a', undefined, 'b', undefined]);
            expect(uniqueIds).toStrictEqual(['a', undefined, 'b', undefined]);
            expect(duplicates).toStrictEqual([])
        });
    });
});
