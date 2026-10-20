import { describe, expect, it, vi } from 'vitest';

import { CategoryScale } from 'ag-charts-core';

import { tickGenerationParams } from '../test/axisAccessors';
import { generateTicks } from './generateTicks';
import { withTemporaryDomain } from './generateTicksUtils';

describe('withTemporaryDomain on a CategoryScale', () => {
    const categories = (count: number) => Array.from({ length: count }, (_, i) => `c${i}`);

    const newScale = (domain: string[]) => {
        const scale = new CategoryScale<string>();
        scale.domain = domain;
        scale.range = [0, 1000];
        return scale;
    };

    it('restores the domain and its lookups when the callback throws', () => {
        const domain = categories(20);
        const scale = newScale(domain);
        expect(scale.findIndex('c19')).toBe(19);

        expect(() =>
            withTemporaryDomain(scale, ['c3'], () => {
                expect(scale.findIndex('c3')).toBe(0);
                throw new Error('layout failed');
            })
        ).toThrow('layout failed');

        expect(scale.domain).toBe(domain);
        expect(scale.findIndex('c19')).toBe(19);
        expect(scale.findIndex('c3')).toBe(3);
    });

    it('keeps lookups correct for nested temporary domains', () => {
        const scale = newScale(categories(10));
        expect(scale.findIndex('c9')).toBe(9);

        withTemporaryDomain(scale, ['c4', 'c5', 'c6'], () => {
            expect(scale.findIndex('c6')).toBe(2);
            withTemporaryDomain(scale, ['c6', 'c7'], () => {
                expect(scale.findIndex('c7')).toBe(1);
                expect(scale.findIndex('c4')).toBeUndefined();
            });
            expect(scale.findIndex('c6')).toBe(2);
            expect(scale.findIndex('c4')).toBe(0);
            expect(scale.findIndex('c9')).toBeUndefined();
        });

        expect(scale.findIndex('c9')).toBe(9);
        expect(scale.findIndex('c4')).toBe(4);
    });

    it('does not rebuild the index of a large domain on every tick generation', () => {
        const domain = categories(3_000);
        const scale = newScale(domain);
        expect(scale.findIndex('c2999')).toBe(2999);
        // The axis hands tick generation its own array of the same categories, so each pass swaps domains.
        const params = tickGenerationParams({ scale, domain: [...domain], range: [0, 1000] });

        // An upper bound: the spy counts writes to every Map, so allow one n-entry index build plus other writes.
        const set = vi.spyOn(Map.prototype, 'set');
        let writes: number;
        try {
            for (let i = 0; i < 3; i++) {
                expect(generateTicks(params).tickData.ticks.length).toBeGreaterThan(0);
            }
            writes = set.mock.calls.length;
        } finally {
            set.mockRestore();
        }

        expect(scale.domain).toBe(domain);
        expect(writes).toBeLessThan(domain.length * 2);
        expect(scale.findIndex('c2999')).toBe(2999);
    });
});
