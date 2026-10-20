import { describe, expect, it, vi } from 'vitest';

import { shareInFlight } from './shareInFlight';

describe('shareInFlight', () => {
    it('runs the loader once for concurrent callers', async () => {
        const load = vi.fn(() => Promise.resolve('result'));
        const shared = shareInFlight(load);

        await expect(Promise.all([shared(), shared(), shared()])).resolves.toEqual(['result', 'result', 'result']);
        expect(load).toHaveBeenCalledTimes(1);
    });

    it('loads afresh once the previous run has settled', async () => {
        const load = vi.fn(() => Promise.resolve('result'));
        const shared = shareInFlight(load);

        await shared();
        await shared();

        expect(load).toHaveBeenCalledTimes(2);
    });

    it('loads afresh after a rejection', async () => {
        const load = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('result');
        const shared = shareInFlight(load);

        await expect(shared()).rejects.toThrow('boom');
        await expect(shared()).resolves.toBe('result');
    });
});
