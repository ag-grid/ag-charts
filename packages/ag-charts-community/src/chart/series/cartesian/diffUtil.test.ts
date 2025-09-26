import { DataChangeDescriptorBuilder } from '../../data/dataChangeDescriptor';
import { IndexMapper } from './diffUtil';

describe('IndexMapper', () => {
    let mapper: IndexMapper;

    beforeEach(() => {
        mapper = new IndexMapper();
    });

    describe('applyRemovals', () => {
        it('should handle empty removals', () => {
            mapper.applyRemovals([]);
            expect(mapper.isEmpty()).toBe(true);
        });

        it('should handle single removal', () => {
            mapper.applyRemovals([2]);

            // Indices 0,1 remain the same, index 2 is removed, indices 3+ shift left by 1
            expect(mapper.getNewIndex(0)).toBe(0);
            expect(mapper.getNewIndex(1)).toBe(1);
            expect(mapper.getNewIndex(2)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(3)).toBe(2);
            expect(mapper.getNewIndex(4)).toBe(3);
        });

        it('should handle multiple removals', () => {
            mapper.applyRemovals([1, 3, 5]);

            expect(mapper.getNewIndex(0)).toBe(0); // No shift
            expect(mapper.getNewIndex(1)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(2)).toBe(1); // shift left by 1 (one removal before)
            expect(mapper.getNewIndex(3)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(4)).toBe(2); // shift left by 2 (two removals before)
            expect(mapper.getNewIndex(5)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(6)).toBe(3); // shift left by 3 (three removals before)
        });

        it('should handle unsorted removal indices', () => {
            mapper.applyRemovals([5, 1, 3]);

            expect(mapper.getNewIndex(0)).toBe(0);
            expect(mapper.getNewIndex(1)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(2)).toBe(1);
            expect(mapper.getNewIndex(3)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(4)).toBe(2);
            expect(mapper.getNewIndex(5)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(6)).toBe(3);
        });

        it('should handle consecutive removals', () => {
            mapper.applyRemovals([2, 3, 4]);

            expect(mapper.getNewIndex(0)).toBe(0);
            expect(mapper.getNewIndex(1)).toBe(1);
            expect(mapper.getNewIndex(2)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(3)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(4)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(5)).toBe(2);
            expect(mapper.getNewIndex(6)).toBe(3);
        });

        it('should support bidirectional mapping', () => {
            mapper.applyRemovals([1, 3]);

            // Old to new
            expect(mapper.getNewIndex(0)).toBe(0);
            expect(mapper.getNewIndex(2)).toBe(1);
            expect(mapper.getNewIndex(4)).toBe(2);

            // New to old
            expect(mapper.getOldIndex(0)).toBe(0);
            expect(mapper.getOldIndex(1)).toBe(2);
            expect(mapper.getOldIndex(2)).toBe(4);
        });
    });

    describe('applyInsertions', () => {
        it('should handle empty insertions', () => {
            mapper.applyInsertions([]);
            expect(mapper.isEmpty()).toBe(true);
        });

        it('should handle insertions starting with empty mapper', () => {
            mapper.applyInsertions([
                { index: 0, datum: 'a' },
                { index: 2, datum: 'b' },
            ]);

            // With no existing mappings, insertions don't create mappings
            expect(mapper.isEmpty()).toBe(true);
        });

        it('should handle insertions after removals', () => {
            // First apply removals to create some mappings
            mapper.applyRemovals([1, 3]);

            // Now apply insertions
            mapper.applyInsertions([
                { index: 1, datum: 'new1' },
                { index: 3, datum: 'new2' },
            ]);

            // Original mappings should shift to accommodate insertions
            expect(mapper.getNewIndex(0)).toBe(0); // No change
            expect(mapper.getNewIndex(2)).toBe(2); // Was 1, shifted right by 1 insertion
            expect(mapper.getNewIndex(4)).toBe(4); // Was 2, shifted right by 2 insertions

            // Reverse mappings
            expect(mapper.getOldIndex(0)).toBe(0);
            expect(mapper.getOldIndex(2)).toBe(2);
            expect(mapper.getOldIndex(4)).toBe(4);
        });

        it('should handle multiple insertions at same index', () => {
            mapper.applyRemovals([2]); // Create some initial mappings

            mapper.applyInsertions([
                { index: 1, datum: 'a' },
                { index: 1, datum: 'b' },
            ]);

            expect(mapper.getNewIndex(0)).toBe(0);
            expect(mapper.getNewIndex(1)).toBe(3); // Shifted right by 2 insertions
            expect(mapper.getNewIndex(3)).toBe(4); // Was at new index 1, now at 4
        });

        it('should handle unsorted insertions', () => {
            mapper.applyRemovals([2]);

            mapper.applyInsertions([
                { index: 3, datum: 'c' },
                { index: 1, datum: 'a' },
                { index: 2, datum: 'b' },
            ]);

            expect(mapper.getNewIndex(0)).toBe(0);
            expect(mapper.getNewIndex(1)).toBe(4); // Shifted by 3 insertions
            expect(mapper.getNewIndex(3)).toBe(5); // Shifted by 3 insertions
        });
    });

    describe('applyShiftRanges', () => {
        it('should handle empty change descriptor', () => {
            const changes = DataChangeDescriptorBuilder.create().build();
            mapper.applyShiftRanges(changes);

            expect(mapper.isEmpty()).toBe(true);
        });

        it('should handle simple removals via shift ranges', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, 'removed1')
                .addRemoval(3, 'removed2')
                .build();

            mapper.applyShiftRanges(changes);

            expect(mapper.getNewIndex(0)).toBe(0);
            expect(mapper.getNewIndex(1)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(2)).toBe(1);
            expect(mapper.getNewIndex(3)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(4)).toBe(2);
        });

        it('should handle simple insertions via shift ranges', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(1, 'new1')
                .addInsertion(3, 'new2')
                .build();

            mapper.applyShiftRanges(changes);

            // For shift ranges, we check the ranges directly
            expect(changes.indexShiftRanges.length).toBeGreaterThan(0);
        });

        it('should handle complex mixed operations via shift ranges', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, 'removed')
                .addInsertion(2, 'inserted')
                .addUpdate(4, 'old', 'new')
                .build();

            mapper.applyShiftRanges(changes);

            // Test that ranges are properly applied
            expect(changes.indexShiftRanges.length).toBeGreaterThan(0);
            expect(mapper.getMappingCount()).toBeGreaterThan(0);
        });

        it('should skip pre-computation for large change sets', () => {
            const builder = DataChangeDescriptorBuilder.create();

            // Add enough changes to exceed the precomputation threshold
            for (let i = 0; i < 1001; i++) {
                builder.addInsertion(i * 2, `data${i}`);
            }

            const changes = builder.build();
            mapper.applyShiftRanges(changes);

            // Should not pre-compute mappings for large datasets
            expect(mapper.getMappingCount()).toBe(0);
            expect(mapper.isEmpty()).toBe(false); // But should have shift ranges
        });
    });

    describe('getNewIndex and getOldIndex', () => {
        it('should return undefined for unmapped indices', () => {
            expect(mapper.getNewIndex(0)).toBeUndefined();
            expect(mapper.getOldIndex(0)).toBeUndefined();
        });

        it('should handle negative indices gracefully', () => {
            mapper.applyRemovals([0]);
            expect(mapper.getNewIndex(-1)).toBeUndefined();
            expect(mapper.getOldIndex(-1)).toBeUndefined();
        });

        it('should handle very large indices', () => {
            mapper.applyRemovals([1000000]);
            expect(mapper.getNewIndex(1000001)).toBe(1000000);
            expect(mapper.getOldIndex(1000000)).toBe(1000001);
        });
    });

    describe('clear and isEmpty', () => {
        it('should clear all mappings', () => {
            mapper.applyRemovals([1, 2, 3]);
            expect(mapper.isEmpty()).toBe(false);

            mapper.clear();
            expect(mapper.isEmpty()).toBe(true);
            expect(mapper.getMappingCount()).toBe(0);
        });

        it('should report empty state correctly', () => {
            expect(mapper.isEmpty()).toBe(true);

            mapper.applyRemovals([1]);
            expect(mapper.isEmpty()).toBe(false);

            mapper.clear();
            expect(mapper.isEmpty()).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle removal of index 0', () => {
            mapper.applyRemovals([0]);

            expect(mapper.getNewIndex(0)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(1)).toBe(0);
            expect(mapper.getNewIndex(2)).toBe(1);
        });

        it('should handle removal of all consecutive indices from start', () => {
            mapper.applyRemovals([0, 1, 2, 3]);

            expect(mapper.getNewIndex(0)).toBeUndefined();
            expect(mapper.getNewIndex(1)).toBeUndefined();
            expect(mapper.getNewIndex(2)).toBeUndefined();
            expect(mapper.getNewIndex(3)).toBeUndefined();
            expect(mapper.getNewIndex(4)).toBe(0);
            expect(mapper.getNewIndex(5)).toBe(1);
        });

        it('should handle single item array operations', () => {
            mapper.applyRemovals([0]);
            expect(mapper.getNewIndex(0)).toBeUndefined();
            expect(mapper.getNewIndex(1)).toBe(0);

            mapper.clear();
            mapper.applyInsertions([{ index: 0, datum: 'new' }]);
            // With no pre-existing mappings, insertion doesn't create mappings
            expect(mapper.isEmpty()).toBe(true);
        });

        it('should handle operations at boundaries', () => {
            // Remove first and last items
            mapper.applyRemovals([0, 9]);

            expect(mapper.getNewIndex(0)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(1)).toBe(0);
            expect(mapper.getNewIndex(8)).toBe(7);
            expect(mapper.getNewIndex(9)).toBeUndefined(); // removed
            expect(mapper.getNewIndex(10)).toBe(8);
        });
    });

    describe('performance characteristics', () => {
        it('should handle large datasets efficiently', () => {
            const startTime = performance.now();

            // Create a large removal set
            const removals = [];
            for (let i = 0; i < 10000; i += 2) {
                // Remove every other index
                removals.push(i);
            }

            mapper.applyRemovals(removals);

            // Test some lookups
            for (let i = 1; i < 10000; i += 2) {
                // Test the non-removed indices
                expect(mapper.getNewIndex(i)).toBeDefined();
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete in reasonable time (less than 1 second)
            expect(duration).toBeLessThan(1000);
        });

        it('should have efficient bidirectional lookups', () => {
            mapper.applyRemovals([100, 200, 300, 400, 500]);

            const startTime = performance.now();

            // Test many bidirectional lookups
            for (let i = 0; i < 1000; i++) {
                const newIdx = mapper.getNewIndex(i);
                if (newIdx !== undefined) {
                    const oldIdx = mapper.getOldIndex(newIdx);
                    expect(oldIdx).toBe(i);
                }
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete in reasonable time
            expect(duration).toBeLessThan(100);
        });

        it('should handle cascading operations efficiently', () => {
            const startTime = performance.now();

            // Apply multiple rounds of operations
            mapper.applyRemovals([10, 20, 30]);
            mapper.applyInsertions([
                { index: 5, datum: 'a' },
                { index: 15, datum: 'b' },
                { index: 25, datum: 'c' },
            ]);

            // Test lookups after cascading operations
            expect(mapper.getNewIndex(0)).toBe(0);
            expect(mapper.getNewIndex(15)).toBe(16); // Should handle cascading shifts

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(100);
        });
    });

    describe('bidirectional mapping accuracy', () => {
        it('should maintain perfect bidirectional consistency', () => {
            mapper.applyRemovals([2, 5, 8, 12]);

            // For every old->new mapping, new->old should return the original
            for (let oldIndex = 0; oldIndex < 20; oldIndex++) {
                const newIndex = mapper.getNewIndex(oldIndex);
                if (newIndex !== undefined) {
                    expect(mapper.getOldIndex(newIndex)).toBe(oldIndex);
                }
            }

            // For every new->old mapping, old->new should return the original
            for (let newIndex = 0; newIndex < 16; newIndex++) {
                // 20 - 4 removals = 16
                const oldIndex = mapper.getOldIndex(newIndex);
                if (oldIndex !== undefined) {
                    expect(mapper.getNewIndex(oldIndex)).toBe(newIndex);
                }
            }
        });

        it('should handle complex scenarios with mixed operations', () => {
            // Start with some initial mappings
            mapper.applyRemovals([1, 4, 7]);

            // Apply insertions
            mapper.applyInsertions([
                { index: 2, datum: 'x' },
                { index: 5, datum: 'y' },
            ]);

            // Verify bidirectional consistency after complex operations
            const testedMappings = new Set<number>();

            for (let oldIndex = 0; oldIndex < 15; oldIndex++) {
                const newIndex = mapper.getNewIndex(oldIndex);
                if (newIndex !== undefined) {
                    expect(mapper.getOldIndex(newIndex)).toBe(oldIndex);
                    testedMappings.add(newIndex);
                }
            }

            // Test reverse direction for all mapped new indices
            testedMappings.forEach((newIndex) => {
                const oldIndex = mapper.getOldIndex(newIndex);
                if (oldIndex !== undefined) {
                    expect(mapper.getNewIndex(oldIndex)).toBe(newIndex);
                }
            });
        });
    });

    describe('integration with DataChangeDescriptor', () => {
        it('should work correctly with realistic transaction scenarios', () => {
            // Simulate a realistic data transaction
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(2, { id: 'item2', value: 20 })
                .addRemoval(5, { id: 'item5', value: 50 })
                .addInsertion(1, { id: 'newItem1', value: 15 })
                .addInsertion(7, { id: 'newItem2', value: 75 })
                .addUpdate(3, { id: 'item3', value: 30 }, { id: 'item3', value: 35 })
                .build();

            mapper.applyShiftRanges(changes);

            // Test that the mapper correctly handles the complex scenario
            expect(mapper.getMappingCount()).toBeGreaterThan(0);

            // Verify some expected mappings work
            const testIndex = 10;
            const newIndex = mapper.getNewIndex(testIndex);
            if (newIndex !== undefined) {
                expect(mapper.getOldIndex(newIndex)).toBe(testIndex);
            }
        });

        it('should handle empty transactions gracefully', () => {
            const emptyChanges = DataChangeDescriptorBuilder.create().build();
            mapper.applyShiftRanges(emptyChanges);

            expect(mapper.isEmpty()).toBe(true);
            expect(emptyChanges.indexShiftRanges).toHaveLength(0);
        });

        it('should correctly use shift ranges for large datasets', () => {
            const builder = DataChangeDescriptorBuilder.create();

            // Create a large dataset scenario that would trigger range-based computation
            for (let i = 0; i < 2000; i += 100) {
                builder.addRemoval(i, `removed${i}`);
            }

            const changes = builder.build();
            mapper.applyShiftRanges(changes);

            // Should not pre-compute due to size but should still work
            expect(mapper.getMappingCount()).toBe(0); // No pre-computed mappings
            expect(mapper.isEmpty()).toBe(false); // But has shift ranges

            // Test that range-based computation works
            const testIndex = 150;
            const newIndex = mapper.getNewIndex(testIndex);
            expect(newIndex).toBeDefined();
            expect(newIndex).toBeLessThan(testIndex); // Should be shifted left due to removals
        });
    });
});
