import { describe, expect, it } from 'vitest';

import { getPath, mergeDefaults, mergeDefaultsShallowOperations } from './object';

describe('mergeDefaultsShallowOperations', () => {
    it('replaces an operation rather than merging into its arguments', () => {
        const merged = mergeDefaultsShallowOperations(
            { padding: { $applyPadding: { top: 1, bottom: 1 } } },
            { padding: { $applyPadding: { $if: [true, 5, 0] } } }
        );

        expect(merged.padding).toEqual({ $applyPadding: { top: 1, bottom: 1 } });
    });

    it('replaces an operation keyed differently from the one it outranks', () => {
        const merged = mergeDefaultsShallowOperations({ style: { $apply: [1] } }, { style: { $switch: [2] } });

        expect(merged.style).toEqual({ $apply: [1] });
    });

    it('keeps a lower-precedence operation when nothing outranks it', () => {
        const merged = mergeDefaultsShallowOperations({ other: 1 }, { style: { $apply: [1] } });

        expect(merged).toEqual({ other: 1, style: { $apply: [1] } });
    });

    it('lets a literal value replace an operation', () => {
        const merged = mergeDefaultsShallowOperations({ padding: 2 }, { padding: { $applyPadding: 0 } });

        expect(merged.padding).toBe(2);
    });

    it('still deep-merges objects holding no operation', () => {
        const merged = mergeDefaultsShallowOperations(
            { axes: { number: { nice: false } } },
            { axes: { number: { gridLine: { width: 2 } } } }
        );

        expect(merged.axes).toEqual({ number: { nice: false, gridLine: { width: 2 } } });
    });
});

describe('mergeDefaults', () => {
    it('merges through an operation key', () => {
        const merged = mergeDefaults(
            { padding: { $applyPadding: { top: 1 } } },
            { padding: { $applyPadding: { $if: [true, 5, 0] } } }
        );

        expect(merged.padding).toEqual({ $applyPadding: { top: 1, $if: [true, 5, 0] } });
    });
});

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
