import { describe, expect, it } from 'vitest';

import { ensureEpochColumn, getEpochColumn, invalidateEpochColumn } from './epochColumns';

describe('epochColumns', () => {
    it('parses string columns to epoch ms and caches by column identity', () => {
        const column = ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z', null];
        const epochs = ensureEpochColumn(column);

        expect(epochs).toEqual([Date.parse('2024-01-01T00:00:00Z'), Date.parse('2024-01-02T00:00:00Z'), null]);
        expect(ensureEpochColumn(column)).toBe(epochs);
        expect(getEpochColumn(column)).toBe(epochs);
    });

    it('returns non-string columns unchanged', () => {
        const column = [1, 2, 3];
        expect(ensureEpochColumn(column)).toBe(column);
    });

    it('passes through non-string values in mixed columns', () => {
        const epoch = Date.parse('2024-01-01T00:00:00Z');
        const column = ['2024-01-01T00:00:00Z', epoch + 1000];
        expect(ensureEpochColumn(column)).toEqual([epoch, epoch + 1000]);
    });

    it('invalidation forces a re-parse', () => {
        const column = ['2024-01-01'];
        const first = ensureEpochColumn(column);

        column.push('2024-01-02');
        invalidateEpochColumn(column);
        expect(getEpochColumn(column)).toBeUndefined();

        const second = ensureEpochColumn(column);
        expect(second).not.toBe(first);
        expect(second).toHaveLength(2);
    });
});
