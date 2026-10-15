import { describe, expect, it } from 'vitest';

import { ItemStylerResolutions } from './itemStylerResolutions';

describe('ItemStylerResolutions', () => {
    const resolution = (tag: string) => ({ tag });

    it('returns the stored resolution for an equal flat result', () => {
        const memory = new ItemStylerResolutions();
        const resolved = resolution('a');
        memory.store({ strokeWidth: 2, stroke: 'black', enabled: true }, resolved);

        expect(memory.lookup({ strokeWidth: 2, stroke: 'black', enabled: true })).toBe(resolved);
        expect(memory.lookup({ enabled: true, stroke: 'black', strokeWidth: 2 })).toBe(resolved);
    });

    it('misses on a differing value, a missing key or an extra key', () => {
        const memory = new ItemStylerResolutions();
        memory.store({ strokeWidth: 2, stroke: 'black' }, resolution('a'));

        expect(memory.lookup({ strokeWidth: 3, stroke: 'black' })).toBeUndefined();
        expect(memory.lookup({ strokeWidth: 2 })).toBeUndefined();
        expect(memory.lookup({ strokeWidth: 2, stroke: 'black', fill: 'red' })).toBeUndefined();
        expect(memory.lookup({ strokeWidth: 2, stroke: undefined as any })).toBeUndefined();
    });

    it('tells a result with no keys from an absent result', () => {
        const memory = new ItemStylerResolutions();
        const resolved = resolution('empty');
        memory.store({}, resolved);

        expect(memory.lookup({})).toBe(resolved);
        expect(memory.lookup(undefined)).toBeUndefined();
        expect(memory.lookup({ strokeWidth: 1 })).toBeUndefined();
    });

    it('does not remember results holding var() colours, objects, arrays or undefined', () => {
        const memory = new ItemStylerResolutions();
        const results = [
            { fill: 'var(--cell)' },
            { stroke: 'black', fill: 'var(--cell, red)' },
            { lineDash: [1, 2] },
            { shadow: { enabled: true } },
            { fill: undefined },
            { fill: null },
        ] as any[];

        for (const result of results) {
            memory.store(result, resolution('x'));
            expect(memory.lookup({ ...result })).toBeUndefined();
        }
    });

    it('does not store an absent result or an absent resolution', () => {
        const memory = new ItemStylerResolutions();
        memory.store(undefined, resolution('a'));
        memory.store({ strokeWidth: 1 }, undefined);

        expect(memory.lookup({ strokeWidth: 1 })).toBeUndefined();
    });

    it('is not changed by a styler mutating the object it returned after it was stored', () => {
        const memory = new ItemStylerResolutions();
        const shared = { strokeWidth: 1 };
        const resolved = resolution('one');
        memory.store(shared, resolved);

        shared.strokeWidth = 2;
        expect(memory.lookup({ strokeWidth: 1 })).toBe(resolved);
        expect(memory.lookup({ strokeWidth: 2 })).toBeUndefined();
    });

    it('keeps the four most recent distinct results and evicts the oldest first', () => {
        const memory = new ItemStylerResolutions();
        const resolved = [1, 2, 3, 4, 5].map((n) => resolution(`r${n}`));
        for (let i = 0; i < 4; i++) {
            memory.store({ strokeWidth: i + 1 }, resolved[i]);
        }
        for (let i = 1; i <= 4; i++) {
            expect(memory.lookup({ strokeWidth: i })).toBe(resolved[i - 1]);
        }

        memory.store({ strokeWidth: 5 }, resolved[4]);

        expect(memory.lookup({ strokeWidth: 1 })).toBeUndefined();
        for (let i = 2; i <= 5; i++) {
            expect(memory.lookup({ strokeWidth: i })).toBe(resolved[i - 1]);
        }
    });

    it('forgets everything on clear', () => {
        const memory = new ItemStylerResolutions();
        memory.store({ strokeWidth: 1 }, resolution('a'));
        memory.clear();

        expect(memory.lookup({ strokeWidth: 1 })).toBeUndefined();

        const resolved = resolution('b');
        memory.store({ strokeWidth: 1 }, resolved);
        expect(memory.lookup({ strokeWidth: 1 })).toBe(resolved);
    });
});
