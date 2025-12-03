import { describe, expect, it } from '@jest/globals';

import { BandedDomain, ContinuousDomain, DiscreteDomain } from './dataDomain';

describe('DiscreteDomain', () => {
    describe('default mode (non-unique/sorted)', () => {
        it('should store and retrieve values using Sets', () => {
            const domain = new DiscreteDomain();
            domain.extend('a');
            domain.extend('b');
            domain.extend('c');

            expect(domain.getDomain()).toEqual(['a', 'b', 'c']);
            expect(domain.isSortedUniqueMode()).toBe(false);
        });

        it('should deduplicate values in Set mode', () => {
            const domain = new DiscreteDomain();
            domain.extend('a');
            domain.extend('b');
            domain.extend('a'); // duplicate
            domain.extend('c');
            domain.extend('b'); // duplicate

            const result = domain.getDomain();
            expect(result.length).toBe(3);
            expect(new Set(result)).toEqual(new Set(['a', 'b', 'c']));
        });

        it('should handle Date values by converting to timestamps', () => {
            const domain = new DiscreteDomain();
            const date1 = new Date('2024-01-01');
            const date2 = new Date('2024-01-02');
            const date3 = new Date('2024-01-03');

            domain.extend(date1);
            domain.extend(date2);
            domain.extend(date3);

            expect(domain.isDateDomain()).toBe(true);
            const result = domain.getDomain() as Date[];
            expect(result.length).toBe(3);
            expect(result[0]).toBeInstanceOf(Date);
            expect(result[0].getTime()).toBe(date1.getTime());
        });

        it('should deduplicate Date values in Set mode', () => {
            const domain = new DiscreteDomain();
            const date1 = new Date('2024-01-01');
            const date2 = new Date('2024-01-02');

            domain.extend(date1);
            domain.extend(new Date('2024-01-01')); // same timestamp
            domain.extend(date2);

            expect(domain.getDomain().length).toBe(2);
        });
    });

    describe('sorted unique mode', () => {
        it('should be enabled with setSortedUniqueMode', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(1, true);

            expect(domain.isSortedUniqueMode()).toBe(true);
            expect(domain.getSortOrder()).toBe(1);
        });

        it('should store values in arrays when in sorted mode', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(1, true);

            domain.extend('a');
            domain.extend('b');
            domain.extend('c');

            expect(domain.isSortedUniqueMode()).toBe(true);
            expect(domain.getDomain()).toEqual(['a', 'b', 'c']);
        });

        it('should handle Date values in sorted mode', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(1, true);

            const date1 = new Date('2024-01-01');
            const date2 = new Date('2024-01-02');
            const date3 = new Date('2024-01-03');

            domain.extend(date1);
            domain.extend(date2);
            domain.extend(date3);

            expect(domain.isDateDomain()).toBe(true);
            const result = domain.getDomain() as Date[];
            expect(result.length).toBe(3);
            expect(result[0].getTime()).toBe(date1.getTime());
            expect(result[1].getTime()).toBe(date2.getTime());
            expect(result[2].getTime()).toBe(date3.getTime());
        });

        it('should not deduplicate in sorted mode (assumes unique data)', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(1, true);

            domain.extend('a');
            domain.extend('a'); // duplicate - NOT deduplicated in sorted mode
            domain.extend('b');

            // In sorted mode, we trust the metadata that data is unique
            // If duplicates exist, they will be in the result
            expect(domain.getDomain()).toEqual(['a', 'a', 'b']);
        });

        it('should support descending sort order', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(-1, true);

            expect(domain.getSortOrder()).toBe(-1);
            domain.extend('c');
            domain.extend('b');
            domain.extend('a');

            expect(domain.getDomain()).toEqual(['c', 'b', 'a']);
        });

        it('should not enable sorted mode if isUnique is false', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(1, false);

            // Should remain in Set mode
            expect(domain.isSortedUniqueMode()).toBe(false);
        });
    });

    describe('mixed type handling in sorted mode', () => {
        it('should handle dates mixed with strings in sorted mode', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(1, true);

            // Simulate waterfall data: dates followed by string total label
            const date1 = new Date('2023-10-17');
            const date2 = new Date('2023-10-18');
            const date3 = new Date('2023-10-19');
            domain.extend(date1);
            domain.extend(date2);
            domain.extend(date3);
            domain.extend('Monthly Net'); // Total label - string type

            // Should remain in sorted mode - single array stores all values
            expect(domain.isSortedUniqueMode()).toBe(true);

            const result = domain.getDomain();
            expect(result).toHaveLength(4);
            // Values stored directly - same object references
            expect(result[0]).toBe(date1);
            expect(result[1]).toBe(date2);
            expect(result[2]).toBe(date3);
            expect(result[3]).toBe('Monthly Net');
        });

        it('should handle strings mixed with dates in sorted mode', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(1, true);

            const date = new Date('2023-10-17');
            domain.extend('Category A');
            domain.extend('Category B');
            domain.extend(date);

            // Stays in sorted mode
            expect(domain.isSortedUniqueMode()).toBe(true);
            const result = domain.getDomain();
            expect(result).toHaveLength(3);
            expect(result[0]).toBe('Category A');
            expect(result[1]).toBe('Category B');
            expect(result[2]).toBe(date);
        });

        it('should preserve insertion order in sorted mode', () => {
            const domain = new DiscreteDomain();
            domain.setSortedUniqueMode(1, true);

            const date1 = new Date('2023-10-17');
            const date2 = new Date('2023-10-18');
            domain.extend(date1);
            domain.extend(date2);
            domain.extend('Total');

            const result = domain.getDomain();
            expect(result).toHaveLength(3);
            // Values stored directly - same object references
            expect(result[0]).toBe(date1);
            expect(result[1]).toBe(date2);
            expect(result[2]).toBe('Total');
        });
    });

    describe('mergeFrom', () => {
        describe('fast path (both sorted unique)', () => {
            it('should concatenate arrays when both domains are sorted unique ascending', () => {
                const domain1 = new DiscreteDomain();
                domain1.setSortedUniqueMode(1, true);
                domain1.extend('a');
                domain1.extend('b');

                const domain2 = new DiscreteDomain();
                domain2.setSortedUniqueMode(1, true);
                domain2.extend('c');
                domain2.extend('d');

                domain1.mergeFrom(domain2);

                expect(domain1.isSortedUniqueMode()).toBe(true);
                expect(domain1.getDomain()).toEqual(['a', 'b', 'c', 'd']);
            });

            it('should concatenate Date arrays when both domains are sorted unique', () => {
                const domain1 = new DiscreteDomain();
                domain1.setSortedUniqueMode(1, true);
                domain1.extend(new Date('2024-01-01'));
                domain1.extend(new Date('2024-01-02'));

                const domain2 = new DiscreteDomain();
                domain2.setSortedUniqueMode(1, true);
                domain2.extend(new Date('2024-01-03'));
                domain2.extend(new Date('2024-01-04'));

                domain1.mergeFrom(domain2);

                expect(domain1.isSortedUniqueMode()).toBe(true);
                const result = domain1.getDomain() as Date[];
                expect(result.length).toBe(4);
                expect(result[0].getTime()).toBe(new Date('2024-01-01').getTime());
                expect(result[3].getTime()).toBe(new Date('2024-01-04').getTime());
            });

            it('should concatenate arrays when both domains are sorted unique descending', () => {
                const domain1 = new DiscreteDomain();
                domain1.setSortedUniqueMode(-1, true);
                domain1.extend('d');
                domain1.extend('c');

                const domain2 = new DiscreteDomain();
                domain2.setSortedUniqueMode(-1, true);
                domain2.extend('b');
                domain2.extend('a');

                domain1.mergeFrom(domain2);

                expect(domain1.isSortedUniqueMode()).toBe(true);
                expect(domain1.getDomain()).toEqual(['d', 'c', 'b', 'a']);
            });
        });

        describe('default mode (non-unique/sorted)', () => {
            it('should fall back to Set merge when sort orders differ', () => {
                const domain1 = new DiscreteDomain();
                domain1.setSortedUniqueMode(1, true);
                domain1.extend('a');
                domain1.extend('b');

                const domain2 = new DiscreteDomain();
                domain2.setSortedUniqueMode(-1, true); // Different sort order
                domain2.extend('c');
                domain2.extend('d');

                domain1.mergeFrom(domain2);

                // Should have converted to Set mode
                expect(domain1.isSortedUniqueMode()).toBe(false);
                const result = domain1.getDomain();
                expect(result.length).toBe(4);
                expect(new Set(result)).toEqual(new Set(['a', 'b', 'c', 'd']));
            });

            it('should fall back to Set merge when target is not in sorted mode', () => {
                const domain1 = new DiscreteDomain();
                domain1.extend('a');
                domain1.extend('b');

                const domain2 = new DiscreteDomain();
                domain2.setSortedUniqueMode(1, true);
                domain2.extend('c');
                domain2.extend('d');

                domain1.mergeFrom(domain2);

                expect(domain1.isSortedUniqueMode()).toBe(false);
                const result = domain1.getDomain();
                expect(result.length).toBe(4);
            });

            it('should fall back to Set merge when source is not in sorted mode', () => {
                const domain1 = new DiscreteDomain();
                domain1.setSortedUniqueMode(1, true);
                domain1.extend('a');
                domain1.extend('b');

                const domain2 = new DiscreteDomain();
                domain2.extend('c');
                domain2.extend('d');

                domain1.mergeFrom(domain2);

                // Should have converted to Set mode
                expect(domain1.isSortedUniqueMode()).toBe(false);
                const result = domain1.getDomain();
                expect(result.length).toBe(4);
            });

            it('should deduplicate when falling back to Set merge', () => {
                const domain1 = new DiscreteDomain();
                domain1.extend('a');
                domain1.extend('b');

                const domain2 = new DiscreteDomain();
                domain2.extend('b'); // duplicate
                domain2.extend('c');

                domain1.mergeFrom(domain2);

                const result = domain1.getDomain();
                expect(result.length).toBe(3);
                expect(new Set(result)).toEqual(new Set(['a', 'b', 'c']));
            });
        });

        describe('merging empty domains', () => {
            it('should handle merging into empty sorted domain', () => {
                const domain1 = new DiscreteDomain();
                domain1.setSortedUniqueMode(1, true);

                const domain2 = new DiscreteDomain();
                domain2.setSortedUniqueMode(1, true);
                domain2.extend('a');
                domain2.extend('b');

                domain1.mergeFrom(domain2);

                expect(domain1.getDomain()).toEqual(['a', 'b']);
            });

            it('should handle merging empty domain into non-empty', () => {
                const domain1 = new DiscreteDomain();
                domain1.setSortedUniqueMode(1, true);
                domain1.extend('a');
                domain1.extend('b');

                const domain2 = new DiscreteDomain();
                domain2.setSortedUniqueMode(1, true);

                domain1.mergeFrom(domain2);

                expect(domain1.getDomain()).toEqual(['a', 'b']);
            });
        });
    });
});

describe('BandedDomain', () => {
    describe('sorted mode metadata', () => {
        it('should accept sort order metadata', () => {
            const domain = new BandedDomain(() => new DiscreteDomain(), {}, true);
            domain.setSortOrderMetadata(1, true);

            // Metadata is stored internally - we verify by checking band creation
            domain.initializeBands(100);

            // Get domain should work
            expect(domain.getDomain()).toEqual([]);
        });

        it('should configure sub-domains with sorted mode when creating bands', () => {
            const domain = new BandedDomain(
                () => new DiscreteDomain(),
                { minDataSizeForBanding: 1, targetBandCount: 2 },
                true
            );
            domain.setSortOrderMetadata(1, true);
            domain.initializeBands(10);

            // Extend with date data to verify sorted mode is active
            const dates = Array.from({ length: 10 }, (_, i) => new Date(`2024-01-${String(i + 1).padStart(2, '0')}`));
            domain.extendBandsFromData(dates);

            const result = domain.getDomain();
            expect(result.length).toBe(10);
            expect(result[0]).toBeInstanceOf(Date);
        });
    });

    describe('getDomain with sorted concatenation', () => {
        it('should concatenate sorted bands efficiently', () => {
            const domain = new BandedDomain(
                () => new DiscreteDomain(),
                { minDataSizeForBanding: 1, targetBandCount: 3 },
                true
            );
            domain.setSortOrderMetadata(1, true);
            domain.initializeBands(9);

            // Create sorted ascending data
            const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
            domain.extendBandsFromData(data);

            const result = domain.getDomain();
            // Should be concatenated in order
            expect(result).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
        });

        it('should concatenate sorted Date bands efficiently', () => {
            const domain = new BandedDomain(
                () => new DiscreteDomain(),
                { minDataSizeForBanding: 1, targetBandCount: 3 },
                true
            );
            domain.setSortOrderMetadata(1, true);
            domain.initializeBands(9);

            // Create sorted ascending date data
            const data = Array.from({ length: 9 }, (_, i) => new Date(`2024-01-${String(i + 1).padStart(2, '0')}`));
            domain.extendBandsFromData(data);

            const result = domain.getDomain() as Date[];
            expect(result.length).toBe(9);
            expect(result[0].getTime()).toBe(new Date('2024-01-01').getTime());
            expect(result[8].getTime()).toBe(new Date('2024-01-09').getTime());
        });

        it('should fall back to Set merge when not in sorted mode', () => {
            const domain = new BandedDomain(
                () => new DiscreteDomain(),
                { minDataSizeForBanding: 1, targetBandCount: 3 },
                true
            );
            // No setSortOrderMetadata call - not in sorted mode
            domain.initializeBands(9);

            const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
            domain.extendBandsFromData(data);

            const result = domain.getDomain();
            // Should still get all values (via Set merge)
            expect(result.length).toBe(9);
            expect(new Set(result)).toEqual(new Set(data));
        });

        it('should use cache for subsequent getDomain calls', () => {
            const domain = new BandedDomain(
                () => new DiscreteDomain(),
                { minDataSizeForBanding: 1, targetBandCount: 2 },
                true
            );
            domain.setSortOrderMetadata(1, true);
            domain.initializeBands(6);

            const data = ['a', 'b', 'c', 'd', 'e', 'f'];
            domain.extendBandsFromData(data);

            const result1 = domain.getDomain();
            const result2 = domain.getDomain();

            // Should return the same cached array
            expect(result1).toBe(result2);
        });

        it('should invalidate cache when bands are marked dirty', () => {
            const domain = new BandedDomain(
                () => new DiscreteDomain(),
                { minDataSizeForBanding: 1, targetBandCount: 2 },
                true
            );
            domain.setSortOrderMetadata(1, true);
            domain.initializeBands(6);

            const data = ['a', 'b', 'c', 'd', 'e', 'f'];
            domain.extendBandsFromData(data);

            const result1 = domain.getDomain();

            // Mark bands dirty
            domain.markBandsDirty(0, 3);

            // Re-extend to clear dirty state
            domain.extendBandsFromData(data);

            const result2 = domain.getDomain();

            // Should be a different array (cache was invalidated)
            expect(result1).not.toBe(result2);
            expect(result2).toEqual(result1);
        });
    });

    describe('single band optimization', () => {
        it('should return sub-domain directly for single band', () => {
            const domain = new BandedDomain(
                () => new DiscreteDomain(),
                { minDataSizeForBanding: 100, targetBandCount: 5 }, // High threshold
                true
            );
            domain.setSortOrderMetadata(1, true);
            domain.initializeBands(10); // Below threshold, single band

            const data = ['a', 'b', 'c'];
            domain.extendBandsFromData(data);

            const result = domain.getDomain();
            expect(result).toEqual(['a', 'b', 'c']);
        });
    });

    describe('continuous domain (not affected by sorted mode)', () => {
        it('should find min/max across bands for continuous domains', () => {
            const domain = new BandedDomain<number>(
                () => new ContinuousDomain(),
                { minDataSizeForBanding: 1, targetBandCount: 3 },
                false // Not discrete
            );
            domain.initializeBands(9);

            const data = [1, 5, 3, 9, 2, 7, 4, 8, 6];
            domain.extendBandsFromData(data);

            const result = domain.getDomain();
            expect(result).toEqual([1, 9]); // [min, max]
        });
    });
});

describe('Integration: sorted domain with incremental updates', () => {
    it('should efficiently handle append-only updates with sorted unique data', () => {
        const domain = new BandedDomain(
            () => new DiscreteDomain(),
            { minDataSizeForBanding: 1, targetBandCount: 3 },
            true
        );
        domain.setSortOrderMetadata(1, true);

        // Initial data
        domain.initializeBands(6);
        const initialData = Array.from({ length: 6 }, (_, i) => new Date(`2024-01-${String(i + 1).padStart(2, '0')}`));
        domain.extendBandsFromData(initialData);

        let result = domain.getDomain() as Date[];
        expect(result.length).toBe(6);

        // Simulate append by handling insertion
        domain.handleInsertion(6, 3);

        // New data (appended at the end)
        const newData = [...initialData, new Date('2024-01-07'), new Date('2024-01-08'), new Date('2024-01-09')];
        domain.extendBandsFromData(newData);

        result = domain.getDomain() as Date[];
        expect(result.length).toBe(9);
        expect(result[0].getTime()).toBe(new Date('2024-01-01').getTime());
        expect(result[8].getTime()).toBe(new Date('2024-01-09').getTime());
    });
});
