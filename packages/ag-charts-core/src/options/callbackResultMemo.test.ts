import { describe, expect, it } from 'vitest';

import { CallbackResultMemo, hasOnlyPlainValues } from './callbackResultMemo';

describe('hasOnlyPlainValues', () => {
    it.each([
        [{}],
        [{ fill: 'red' }],
        [{ strokeWidth: 2 }],
        [{ enabled: true }],
        [{ fill: 'red', strokeWidth: 2, enabled: false }],
    ])('accepts only strings, numbers and booleans: %j', (result) => {
        expect(hasOnlyPlainValues(result)).toBe(true);
    });

    it.each([
        ['a CSS variable', { fill: 'var(--cell)' }],
        ['a CSS variable with a fallback', { stroke: 'black', fill: 'var(--cell, red)' }],
        ['a CSS variable inside other text', { fill: 'color-mix(in srgb, var(--cell) 50%, white)' }],
        ['a nested object', { shadow: { enabled: true } }],
        ['a theme reference', { fill: { ref: 'accentColor' } }],
        ['an array', { lineDash: [1, 2] }],
        ['undefined', { fill: undefined }],
        ['null', { fill: null }],
        ['a function', { fill: () => 'red' }],
        ['a bigint', { strokeWidth: 1n }],
    ])('rejects %s', (_name, result) => {
        expect(hasOnlyPlainValues(result)).toBe(false);
    });
});

describe('CallbackResultMemo', () => {
    describe('keyFor', () => {
        const memo = new CallbackResultMemo<object>();

        it('gives equal results the same key', () => {
            expect(memo.keyFor({ fill: 'red', strokeWidth: 2 })).toBe(memo.keyFor({ fill: 'red', strokeWidth: 2 }));
        });

        it('gives a result with no properties a key, unlike an unkeyable one', () => {
            expect(memo.keyFor({})).toBeDefined();
            expect(memo.keyFor({})).not.toBe(memo.keyFor({ fill: 'red' }));
        });

        it('gives results that differ in a value, a property name or a property count different keys', () => {
            const keys = [
                memo.keyFor({ fill: 'red' }),
                memo.keyFor({ fill: 'blue' }),
                memo.keyFor({ stroke: 'red' }),
                memo.keyFor({ fill: 'red', stroke: 'red' }),
                memo.keyFor({ fill: 'red', strokeWidth: 1 }),
                memo.keyFor({ fill: 'red', strokeWidth: 2 }),
            ];
            expect(keys.every((key) => key !== undefined)).toBe(true);
            expect(new Set(keys).size).toBe(keys.length);
        });

        it('keeps a string, a number and a boolean with the same text apart', () => {
            const keys = [
                memo.keyFor({ value: 1 }),
                memo.keyFor({ value: '1' }),
                memo.keyFor({ value: true }),
                memo.keyFor({ value: 'true' }),
                memo.keyFor({ value: false }),
                memo.keyFor({ value: 'false' }),
            ];
            expect(new Set(keys).size).toBe(keys.length);
        });

        it('keeps two results apart when a value could be read as the boundary between properties', () => {
            const keys = [
                memo.keyFor({ a: 'x', b: 'y' }),
                memo.keyFor({ a: 'x:b', b: 'y' }),
                memo.keyFor({ a: 'x1:b1:y' }),
                memo.keyFor({ a: 'x', b: 'y', c: '' }),
                memo.keyFor({ a: 'x', 'b:y': '' }),
                memo.keyFor({ a: '', b: 'xy' }),
            ];
            expect(new Set(keys).size).toBe(keys.length);
        });

        it.each([
            ['a CSS variable', { fill: 'var(--cell)' }],
            ['a nested object', { shadow: { enabled: true } }],
            ['a theme reference', { fill: { ref: 'accentColor' } }],
            ['an array value', { lineDash: [1, 2] }],
            ['an undefined value', { fill: undefined }],
            ['a null value', { fill: null }],
            ['a function value', { fill: () => 'red' }],
            ['one unkeyable value among keyable ones', { stroke: 'black', strokeWidth: 2, fill: 'var(--cell)' }],
        ])('has no key for a result with %s', (_name, result) => {
            expect(memo.keyFor(result)).toBeUndefined();
        });

        it.each([
            ['undefined', undefined],
            ['null', null],
            ['a string', 'red'],
            ['a number', 3],
            ['an array', ['red']],
            ['a function', () => ({})],
        ])('has no key when the result is %s', (_name, result) => {
            expect(memo.keyFor(result)).toBeUndefined();
        });
    });

    describe('get and set', () => {
        it('returns nothing for a key that was not set', () => {
            expect(new CallbackResultMemo<object>().get('missing')).toBeUndefined();
        });

        it('returns the stored value for each distinct key', () => {
            const memo = new CallbackResultMemo<object>();
            const red = { fill: 'red' };
            const blue = { fill: 'blue' };

            memo.set(memo.keyFor({ fill: 'red' })!, red);
            memo.set(memo.keyFor({ fill: 'blue' })!, blue);

            expect(memo.get(memo.keyFor({ fill: 'red' })!)).toBe(red);
            expect(memo.get(memo.keyFor({ fill: 'blue' })!)).toBe(blue);
            expect(memo.get(memo.keyFor({ fill: 'green' })!)).toBeUndefined();
        });

        describe('when the cap is reached', () => {
            const ATTEMPTS = 10_000;

            function fill(memo: CallbackResultMemo<{ index: number }>) {
                const keys = Array.from({ length: ATTEMPTS }, (_, index) => memo.keyFor({ fill: `#${index}` })!);
                for (const [index, key] of keys.entries()) memo.set(key, { index });
                return keys;
            }

            it('keeps a bounded number of entries', () => {
                const memo = new CallbackResultMemo<{ index: number }>();
                const keys = fill(memo);

                const kept = keys.filter((key) => memo.get(key) !== undefined).length;
                // Spec: a map with a size cap, so many distinct results (about 256 fills) fit, but not without limit.
                expect(kept).toBeGreaterThanOrEqual(256);
                expect(kept).toBeLessThan(ATTEMPTS);
            });

            it('stops adding rather than evicting, so the first entries stay and the last were never added', () => {
                const memo = new CallbackResultMemo<{ index: number }>();
                const keys = fill(memo);

                const keptIndices = keys.flatMap((key, index) => (memo.get(key) === undefined ? [] : [index]));
                const cap = keptIndices.length;
                expect(keptIndices).toEqual(Array.from({ length: cap }, (_, index) => index));
                expect(memo.get(keys[ATTEMPTS - 1])).toBeUndefined();
            });

            it('still returns the stored values, and adds nothing new, once full', () => {
                const memo = new CallbackResultMemo<{ index: number }>();
                const keys = fill(memo);

                expect(memo.get(keys[0])).toEqual({ index: 0 });
                memo.set(keys[ATTEMPTS - 1], { index: -2 });

                expect(memo.get(keys[0])).toEqual({ index: 0 });
                expect(memo.get(keys[ATTEMPTS - 1])).toBeUndefined();
            });
        });
    });
});
