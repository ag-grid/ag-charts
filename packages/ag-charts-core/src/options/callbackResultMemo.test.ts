import { describe, expect, it } from 'vitest';

import { CallbackResultMemo, isPlainResult } from './callbackResultMemo';

type Cleared = { tag: string };

function remembered(memo: CallbackResultMemo<Cleared>, result: object, tag: string) {
    expect(memo.recall(result)).toBeUndefined();
    const cleared = { tag };
    memo.remember(result, cleared);
    return cleared;
}

describe('CallbackResultMemo', () => {
    describe('recall', () => {
        it('returns what equal results were remembered as, and nothing for a result not remembered', () => {
            const memo = new CallbackResultMemo<Cleared>();
            const cleared = remembered(memo, { fill: 'red', strokeWidth: 2 }, 'a');

            expect(memo.recall({ fill: 'red', strokeWidth: 2 })).toBe(cleared);
            expect(memo.recall({ fill: 'blue', strokeWidth: 2 })).toBeUndefined();
        });

        it('remembers a result with no properties apart from one with some', () => {
            const memo = new CallbackResultMemo<Cleared>();
            const empty = remembered(memo, {}, 'empty');
            remembered(memo, { fill: 'red' }, 'red');

            expect(memo.recall({})).toBe(empty);
        });

        it('keeps a result apart from one it is a prefix of', () => {
            const memo = new CallbackResultMemo<Cleared>();
            const short = remembered(memo, { fill: 'red' }, 'short');
            const long = remembered(memo, { fill: 'red', strokeWidth: 1 }, 'long');

            expect(memo.recall({ fill: 'red' })).toBe(short);
            expect(memo.recall({ fill: 'red', strokeWidth: 1 })).toBe(long);
        });

        it('keeps results apart that differ in a value, a property name or a property count', () => {
            const memo = new CallbackResultMemo<Cleared>();
            const results = [
                { fill: 'red' },
                { fill: 'blue' },
                { stroke: 'red' },
                { fill: 'red', stroke: 'red' },
                { fill: 'red', strokeWidth: 1 },
                { fill: 'red', strokeWidth: 2 },
            ];
            const clearedByResult = results.map((result, index) => remembered(memo, result, `${index}`));

            for (const [index, result] of results.entries()) expect(memo.recall(result)).toBe(clearedByResult[index]);
        });

        it('keeps a string, a number and a boolean with the same text apart', () => {
            const memo = new CallbackResultMemo<Cleared>();
            const results = [{ v: 1 }, { v: '1' }, { v: true }, { v: 'true' }, { v: false }, { v: 'false' }];
            const clearedByResult = results.map((result, index) => remembered(memo, result, `${index}`));

            for (const [index, result] of results.entries()) expect(memo.recall(result)).toBe(clearedByResult[index]);
        });

        it.each([
            ['a CSS variable', { fill: 'var(--cell)' }],
            ['a nested object', { shadow: { enabled: true } }],
            ['a theme reference', { fill: { ref: 'accentColor' } }],
            ['an array value', { lineDash: [1, 2] }],
            ['an undefined value', { fill: undefined }],
            ['a null value', { fill: null }],
            ['a function value', { fill: () => 'red' }],
            ['a bigint value', { strokeWidth: 1n }],
            ['one unkeyable value among plain ones', { stroke: 'black', strokeWidth: 2, fill: 'var(--cell)' }],
        ])('never finds or remembers a result with %s', (_name, result) => {
            const memo = new CallbackResultMemo<Cleared>();
            const cleared = { tag: 'cleared' };

            expect(memo.recall(result)).toBeUndefined();
            memo.remember(result, cleared);

            expect(memo.recall(result)).toBeUndefined();
            expect(isPlainResult(cleared)).toBe(false);
        });

        it.each([
            ['undefined', undefined],
            ['null', null],
            ['a string', 'red'],
            ['a number', 3],
            ['an array', ['red']],
            ['a function', () => ({})],
        ])('never finds a result that is %s', (_name, result) => {
            expect(new CallbackResultMemo<Cleared>().recall(result)).toBeUndefined();
        });
    });

    describe('remember', () => {
        it('ignores a result other than the one recall last missed on being plain', () => {
            const memo = new CallbackResultMemo<Cleared>();
            const cleared = { tag: 'cleared' };

            memo.recall({ fill: 'var(--cell)' });
            memo.remember({ fill: 'red' }, cleared);

            expect(memo.recall({ fill: 'red' })).toBeUndefined();
        });

        it('marks the cleared result of a plain result as plain', () => {
            const memo = new CallbackResultMemo<Cleared>();

            expect(isPlainResult(remembered(memo, { fill: 'red' }, 'a'))).toBe(true);
            expect(isPlainResult({ fill: 'red' })).toBe(false);
        });
    });

    describe('when the cap is reached', () => {
        const ATTEMPTS = 10_000;

        function fill(memo: CallbackResultMemo<{ index: number }>) {
            const results = Array.from({ length: ATTEMPTS }, (_, index) => ({ fill: `#${index}` }));
            for (const [index, result] of results.entries()) {
                memo.recall(result);
                memo.remember(result, { index });
            }
            return results;
        }

        it('keeps the first 1,024 results and never adds the later ones', () => {
            const memo = new CallbackResultMemo<{ index: number }>();
            const results = fill(memo);

            const keptIndices = results.flatMap((result, index) => (memo.recall(result) === undefined ? [] : [index]));
            const cap = keptIndices.length;
            expect(cap).toBe(1024);
            expect(keptIndices).toEqual(Array.from({ length: cap }, (_, index) => index));
        });

        it('still marks a cleared result as plain once full, though it is not remembered', () => {
            const memo = new CallbackResultMemo<{ index: number }>();
            const results = fill(memo);
            const last = results[ATTEMPTS - 1];
            const cleared = { index: -1 };

            memo.recall(last);
            memo.remember(last, cleared);

            expect(memo.recall(last)).toBeUndefined();
            expect(isPlainResult(cleared)).toBe(true);
        });
    });
});
