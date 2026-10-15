import { describe, expect, it, vi } from 'vitest';

import type { PlainObject } from 'ag-charts-core';

import { ItemStylerResolutions } from './itemStylerResolutions';

describe('ItemStylerResolutions', () => {
    function createMemory(
        resolve: (result: PlainObject | undefined) => PlainObject | undefined = (r) =>
            r == null ? undefined : { ...r }
    ) {
        const resolveFn = vi.fn(resolve);
        return { memory: new ItemStylerResolutions(resolveFn), resolveFn };
    }

    it('resolves an equal flat result once and returns the stored resolution', () => {
        const { memory, resolveFn } = createMemory();

        const first = memory.resolve({ strokeWidth: 2, stroke: 'black', enabled: true });

        expect(memory.resolve({ strokeWidth: 2, stroke: 'black', enabled: true })).toBe(first);
        expect(memory.resolve({ enabled: true, stroke: 'black', strokeWidth: 2 })).toBe(first);
        expect(resolveFn).toHaveBeenCalledTimes(1);
    });

    it('resolves again on a differing value, a missing key or an extra key', () => {
        const { memory, resolveFn } = createMemory();
        memory.resolve({ strokeWidth: 2, stroke: 'black' });

        memory.resolve({ strokeWidth: 3, stroke: 'black' });
        memory.resolve({ strokeWidth: 2 });
        memory.resolve({ strokeWidth: 2, stroke: 'black', fill: 'red' });

        expect(resolveFn).toHaveBeenCalledTimes(4);
    });

    it('tells a result with no keys from an absent result', () => {
        const { memory, resolveFn } = createMemory();
        const empty = memory.resolve({});

        expect(memory.resolve({})).toBe(empty);
        expect(resolveFn).toHaveBeenCalledTimes(1);

        expect(memory.resolve(undefined)).toBeUndefined();
        expect(resolveFn).toHaveBeenCalledTimes(2);
        expect(resolveFn).toHaveBeenLastCalledWith(undefined);
    });

    it('does not remember results holding var() colours, objects, arrays or undefined', () => {
        const { memory, resolveFn } = createMemory();
        const results = [
            { fill: 'var(--cell)' },
            { stroke: 'black', fill: 'var(--cell, red)' },
            { lineDash: [1, 2] },
            { shadow: { enabled: true } },
            { fill: undefined },
            { fill: null },
        ] as any[];

        for (const result of results) {
            memory.resolve(result);
            memory.resolve({ ...result });
        }

        expect(resolveFn).toHaveBeenCalledTimes(results.length * 2);
    });

    it('does not remember an absent resolution', () => {
        const { memory, resolveFn } = createMemory(() => undefined);

        expect(memory.resolve({ strokeWidth: 1 })).toBeUndefined();
        expect(memory.resolve({ strokeWidth: 1 })).toBeUndefined();

        expect(resolveFn).toHaveBeenCalledTimes(2);
    });

    it('keeps the four most recently stored results and evicts the oldest first', () => {
        const { memory, resolveFn } = createMemory();
        const resolved = [1, 2, 3, 4].map((strokeWidth) => memory.resolve({ strokeWidth }));
        expect(resolveFn).toHaveBeenCalledTimes(4);
        for (let i = 1; i <= 4; i++) {
            expect(memory.resolve({ strokeWidth: i })).toBe(resolved[i - 1]);
        }
        expect(resolveFn).toHaveBeenCalledTimes(4);

        memory.resolve({ strokeWidth: 5 });
        expect(resolveFn).toHaveBeenCalledTimes(5);

        for (let i = 2; i <= 5; i++) {
            memory.resolve({ strokeWidth: i });
        }
        expect(resolveFn).toHaveBeenCalledTimes(5);

        memory.resolve({ strokeWidth: 1 });
        expect(resolveFn).toHaveBeenCalledTimes(6);
    });

    it('forgets everything on clear', () => {
        const { memory, resolveFn } = createMemory();
        memory.resolve({ strokeWidth: 1 });
        memory.clear();

        memory.resolve({ strokeWidth: 1 });
        memory.resolve({ strokeWidth: 1 });

        expect(resolveFn).toHaveBeenCalledTimes(2);
    });
});
