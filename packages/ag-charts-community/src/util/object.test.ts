import { expect, test } from '@jest/globals';

import { mergeDefaults } from './object';

describe('object module', () => {
    test('mergeDefaults', () => {
        const sources = [
            { y: 2, z: { a: [3], d: [] } },
            { x: 1, y: null, z: { a: [0], b: { c: 4 }, d: {} } },
        ];
        expect(mergeDefaults(...sources)).toEqual({ x: 1, y: 2, z: { a: [3], b: { c: 4 }, d: [] } });
    });
});
