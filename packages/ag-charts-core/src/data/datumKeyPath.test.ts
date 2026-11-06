import { describe, expect, it } from 'vitest';

import { datumKeyName, getPathComponents, readDatumKey, withDatumKey } from './datumKeyPath';

describe('getPathComponents', () => {
    it('parses valid paths', () => {
        expect(getPathComponents(`a . b [ 'c' ] [ "d" ] [ 0 ] [ 99 ]`)).toEqual(['a', 'b', 'c', 'd', '0', '99']);
        expect(getPathComponents(`. b [ 'c' ] [ "d" ] [ 0 ] [ 99 ]`)).toEqual(['b', 'c', 'd', '0', '99']);
        expect(getPathComponents(`[ 'c' ] [ "d" ] [ 0 ] [ 99 ]`)).toEqual(['c', 'd', '0', '99']);
    });

    it('handles string escapes paths', () => {
        expect(getPathComponents(`[ 'a\\'b' ] [ "a\\"b" ]`)).toEqual([`a'b`, `a"b`]);
    });

    it('rejects escaped escapes', () => {
        expect(getPathComponents(`[ 'a\\\\'b' ]`)).toBe(undefined);
        expect(getPathComponents(`[ "a\\\\"b" ]`)).toBe(undefined);
    });

    it('rejects invalid paths', () => {
        expect(getPathComponents(`["test"]other`)).toBe(undefined);
        expect(getPathComponents(`[test]`)).toBe(undefined);
    });
});

describe('readDatumKey', () => {
    const datum = { a: { b: [{ c: 1 }] }, 'a.b': 'literal', flat: 2 };

    it('reads a dot path into nested objects and arrays', () => {
        expect(readDatumKey(datum, 'a.b[0].c', false)).toBe(1);
        expect(readDatumKey(datum, 'flat', false)).toBe(2);
    });

    it('returns undefined for a path through a missing value', () => {
        expect(readDatumKey(datum, 'missing.b', false)).toBeUndefined();
        expect(readDatumKey(undefined, 'a.b', false)).toBeUndefined();
    });

    it('reads the key as a literal property name when dot notation is suppressed', () => {
        expect(readDatumKey(datum, 'a.b', true)).toBe('literal');
    });
});

describe('datumKeyName', () => {
    it('names a path by its last segment', () => {
        expect(datumKeyName('a.b', false)).toBe('b');
        expect(datumKeyName(`a['b c']`, false)).toBe('b c');
        expect(datumKeyName('flat', false)).toBe('flat');
    });

    it('keeps the whole key when dot notation is suppressed', () => {
        expect(datumKeyName('a.b', true)).toBe('a.b');
    });
});

describe('withDatumKey', () => {
    it('writes a dot path into fresh nested objects, leaving the source untouched', () => {
        const source = { a: { b: 1, c: 2 } };
        const result = withDatumKey(source, 'a.b', 3, false);
        expect(result).toEqual({ a: { b: 3, c: 2 } });
        expect(source).toEqual({ a: { b: 1, c: 2 } });
    });

    it('writes the key as a literal property name when dot notation is suppressed', () => {
        expect(withDatumKey({}, 'a.b', 3, true)).toEqual({ 'a.b': 3 });
    });
});
