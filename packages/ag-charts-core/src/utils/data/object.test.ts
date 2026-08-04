import { describe, expect, it } from 'vitest';

import { getPath } from './object';

describe('getPath', () => {
    it('reads a nested value by array or dotted path', () => {
        const object = { a: { b: { c: 1 } } };
        expect(getPath(object, ['a', 'b', 'c'])).toBe(1);
        expect(getPath(object, 'a.b.c')).toBe(1);
    });

    it('returns undefined rather than throwing when an intermediate is missing', () => {
        expect(getPath({ a: {} }, 'a.b.c')).toBeUndefined();
        expect(getPath(undefined, 'a.b')).toBeUndefined();
    });
});
