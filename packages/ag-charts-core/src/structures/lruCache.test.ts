import { describe, expect, it } from 'vitest';

import { LRUCache } from './lruCache';

describe('LRUCache', () => {
    const filled = (...keys: string[]) => {
        const cache = new LRUCache<number>(2);
        for (const [i, key] of keys.entries()) cache.set(key, i);
        return cache;
    };

    it.each([
        { reads: [], evicted: 'a', kept: 'b' },
        { reads: ['a'], evicted: 'b', kept: 'a' },
        { reads: ['b', 'b'], evicted: 'a', kept: 'b' },
        { reads: ['a', 'a', 'b'], evicted: 'a', kept: 'b' },
        { reads: ['b', 'a', 'a'], evicted: 'b', kept: 'a' },
    ])('evicts $evicted after reading $reads', ({ reads, evicted, kept }) => {
        const cache = filled('a', 'b');
        for (const key of reads) cache.get(key);
        cache.set('c', 2);
        expect([cache.has(evicted), cache.has(kept), cache.has('c')]).toEqual([false, true, true]);
    });

    it('refreshes a key that was overwritten in place, since overwriting leaves it where it was', () => {
        const cache = filled('a', 'b', 'a');
        expect(cache.get('a')).toBe(2);
        cache.set('c', 3);
        expect([cache.has('a'), cache.has('b')]).toEqual([true, false]);
    });

    it('forgets the newest key when cleared', () => {
        const cache = filled('a');
        cache.get('a');
        cache.clear();
        expect(cache.get('a')).toBeUndefined();
    });
});
