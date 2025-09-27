import { DataChangeDescriptorBuilder } from './dataChangeDescriptor';
import type { DataGroup } from './dataModel';
import { GroupUpdater } from './groupUpdater';

describe('GroupUpdater', () => {
    // Helper function to create a test group
    function createGroup(keys: any[], indices: number[][]): DataGroup {
        return {
            keys,
            datumIndices: indices,
            aggregation: [],
            validScopes: new Set(['scope1']),
        };
    }

    // Helper function to create a simple key extractor
    function createKeyExtractor() {
        return (datum: any) => [datum.category, datum.series];
    }

    // Helper function to create test data
    function createTestDatum(category: string, series: string, value: number) {
        return { category, series, value };
    }

    describe('updateGroups', () => {
        it('should handle empty changes gracefully', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1, 2]]), createGroup(['B', 'S1'], [[3, 4]])];
            const changes = DataChangeDescriptorBuilder.create().build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // Groups should remain unchanged
            expect(groups).toHaveLength(2);
            expect(groups[0].keys).toEqual(['A', 'S1']);
            expect(groups[0].datumIndices[0]).toEqual([0, 1, 2]);
            expect(groups[1].keys).toEqual(['B', 'S1']);
            expect(groups[1].datumIndices[0]).toEqual([3, 4]);
        });

        it('should handle removals correctly', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1, 2]]), createGroup(['B', 'S1'], [[3, 4]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, createTestDatum('A', 'S1', 10))
                .addRemoval(3, createTestDatum('B', 'S1', 20))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // After removing indices 1 and 3:
            // Original index 0 stays at 0
            // Original index 2 becomes 1 (shifted down by 1)
            // Original index 4 becomes 2 (shifted down by 2)
            expect(groups[0].datumIndices[0]).toEqual([0, 1]); // was [0, 2], now [0, 1]
            expect(groups[1].datumIndices[0]).toEqual([2]); // was [4], now [2]
        });

        it('should remove empty groups after removals', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1]]), createGroup(['B', 'S1'], [[2]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, createTestDatum('A', 'S1', 10))
                .addRemoval(1, createTestDatum('A', 'S1', 15))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // First group should be removed as it's empty
            // Original index 2 becomes 0 (shifted down by 2)
            expect(groups).toHaveLength(1);
            expect(groups[0].keys).toEqual(['B', 'S1']);
            expect(groups[0].datumIndices[0]).toEqual([0]); // was [2], now [0]
        });

        it('should handle insertions correctly', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(2, createTestDatum('A', 'S1', 30))
                .addInsertion(3, createTestDatum('B', 'S1', 40))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // Should have two groups now
            expect(groups).toHaveLength(2);

            // First group should have new index 2
            const groupA = groups.find((g) => g.keys[0] === 'A');
            expect(groupA?.datumIndices[0]).toEqual([0, 1, 2]);

            // New group should be created for B
            const groupB = groups.find((g) => g.keys[0] === 'B');
            expect(groupB?.keys).toEqual(['B', 'S1']);
            expect(groupB?.datumIndices[0]).toEqual([3]);
        });

        it('should handle updates that change group membership', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1]]), createGroup(['B', 'S1'], [[2]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addUpdate(1, createTestDatum('A', 'S1', 10), createTestDatum('B', 'S1', 15))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // Index 1 should move from group A to group B
            const groupA = groups.find((g) => g.keys[0] === 'A');
            const groupB = groups.find((g) => g.keys[0] === 'B');

            expect(groupA?.datumIndices[0]).toEqual([0]);
            expect(groupB?.datumIndices[0]).toEqual([1, 2]);
        });

        it('should handle updates that do not change group membership', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addUpdate(
                    1,
                    createTestDatum('A', 'S1', 10),
                    createTestDatum('A', 'S1', 15) // Same keys
                )
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // Group membership should remain unchanged
            expect(groups).toHaveLength(1);
            expect(groups[0].datumIndices[0]).toEqual([0, 1]);
        });

        it('should apply index shifts correctly', () => {
            const groups = [createGroup(['A', 'S1'], [[2, 3, 4]]), createGroup(['B', 'S1'], [[5, 6]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, createTestDatum('X', 'S1', 0))
                .addInsertion(1, createTestDatum('Y', 'S1', 1))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // After removal at 0, indices shift down by 1: [2,3,4] -> [1,2,3], [5,6] -> [4,5]
            // Then insertion at 1 creates new group Y with index 1
            expect(groups).toHaveLength(3);

            const groupA = groups.find((g) => g.keys[0] === 'A');
            const groupB = groups.find((g) => g.keys[0] === 'B');
            const groupY = groups.find((g) => g.keys[0] === 'Y');

            expect(groupA?.datumIndices[0]).toEqual([1, 2, 3]); // shifted down by 1
            expect(groupB?.datumIndices[0]).toEqual([4, 5]); // shifted down by 1
            expect(groupY?.datumIndices[0]).toEqual([1]); // new insertion
        });

        it('should handle complex mixed operations', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1, 2]]), createGroup(['B', 'S1'], [[3, 4]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, createTestDatum('A', 'S1', 10))
                .addInsertion(4, createTestDatum('C', 'S1', 50))
                .addUpdate(3, createTestDatum('B', 'S1', 30), createTestDatum('A', 'S1', 35))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            expect(groups).toHaveLength(3);

            // After removal of index 1:
            // - Original index 0 stays at 0
            // - Original index 2 becomes 1
            // - Original index 3 becomes 2 (but is updated to move to group A)
            // - Original index 4 becomes 3
            // Then insertion at index 4 creates group C

            const groupA = groups.find((g) => g.keys[0] === 'A');
            const groupB = groups.find((g) => g.keys[0] === 'B');
            const groupC = groups.find((g) => g.keys[0] === 'C');

            expect(groupA?.datumIndices[0]).toEqual([0, 1, 2]); // 0, shifted 2, moved 3->2
            expect(groupB?.datumIndices[0]).toEqual([3]); // shifted 4->3
            expect(groupC?.keys).toEqual(['C', 'S1']);
            expect(groupC?.datumIndices[0]).toEqual([4]); // new insertion
        });

        it('should clear validScopes when changes occur', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1]])];
            groups[0].validScopes.add('scope1');
            groups[0].validScopes.add('scope2');

            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(2, createTestDatum('A', 'S1', 20))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // validScopes should be cleared
            expect(groups[0].validScopes.size).toBe(0);
        });

        it('should preserve validScopes when no changes occur', () => {
            const groups = [createGroup(['A', 'S1'], [[0, 1]])];
            groups[0].validScopes.add('scope1');
            groups[0].validScopes.add('scope2');

            const changes = DataChangeDescriptorBuilder.create().build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // validScopes should be preserved
            expect(groups[0].validScopes.size).toBe(2);
            expect(groups[0].validScopes.has('scope1')).toBe(true);
            expect(groups[0].validScopes.has('scope2')).toBe(true);
        });

        it('should handle object keys correctly', () => {
            const groups = [createGroup([{ name: 'A' }, 'S1'], [[0, 1]])];
            const keyExtractor = (datum: any) => [{ name: datum.category }, datum.series];
            const changes = DataChangeDescriptorBuilder.create()
                .addUpdate(1, { category: 'A', series: 'S1', value: 10 }, { category: 'B', series: 'S1', value: 15 })
                .build();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            expect(groups).toHaveLength(2);

            // Should find groups by object keys
            const groupA = groups.find((g) => g.keys[0]?.name === 'A');
            const groupB = groups.find((g) => g.keys[0]?.name === 'B');

            expect(groupA?.datumIndices[0]).toEqual([0]);
            expect(groupB?.keys).toEqual([{ name: 'B' }, 'S1']);
            expect(groupB?.datumIndices[0]).toEqual([1]);
        });

        it('should maintain sorted indices within groups', () => {
            const groups = [createGroup(['A', 'S1'], [[1, 3, 5]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(2, createTestDatum('A', 'S1', 20))
                .addInsertion(4, createTestDatum('A', 'S1', 40))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // Indices should remain sorted
            const indices = groups[0].datumIndices[0];
            expect(indices).toEqual([1, 2, 3, 4, 5]);

            // Verify indices are actually sorted
            for (let i = 1; i < indices.length; i++) {
                expect(indices[i]).toBeGreaterThan(indices[i - 1]);
            }
        });

        it('should handle edge case with all data removed', () => {
            const groups = [createGroup(['A', 'S1'], [[0]]), createGroup(['B', 'S1'], [[1]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, createTestDatum('A', 'S1', 10))
                .addRemoval(1, createTestDatum('B', 'S1', 20))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // All groups should be removed
            expect(groups).toHaveLength(0);
        });
    });

    describe('key equality', () => {
        it('should handle primitive key equality correctly', () => {
            const groups = [createGroup(['A', 1], [[0]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addUpdate(
                    0,
                    { category: 'A', series: 1, value: 10 },
                    { category: 'A', series: 1, value: 20 } // Same keys, different value
                )
                .build();
            const keyExtractor = (datum: any) => [datum.category, datum.series];

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // Should remain in same group
            expect(groups).toHaveLength(1);
            expect(groups[0].datumIndices[0]).toEqual([0]);
        });

        it('should handle null and undefined keys', () => {
            const groups = [createGroup([null, undefined], [[0]])];
            const changes = DataChangeDescriptorBuilder.create()
                .addUpdate(
                    0,
                    { category: null, series: undefined, value: 10 },
                    { category: 'A', series: 'S1', value: 20 }
                )
                .build();
            const keyExtractor = (datum: any) => [datum.category, datum.series];

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // Should move to new group
            expect(groups).toHaveLength(1); // Old group removed, new group created
            expect(groups[0].keys).toEqual(['A', 'S1']);
            expect(groups[0].datumIndices[0]).toEqual([0]);
        });
    });

    describe('multi-scope support', () => {
        it('should handle multiple scope indices', () => {
            const groups = [
                {
                    keys: ['A', 'S1'],
                    datumIndices: [
                        [0, 1],
                        [2, 3],
                    ], // Two scopes
                    aggregation: [],
                    validScopes: new Set(['scope1', 'scope2']),
                },
            ];
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, createTestDatum('A', 'S1', 10))
                .addRemoval(2, createTestDatum('A', 'S1', 20))
                .build();
            const keyExtractor = createKeyExtractor();

            GroupUpdater.updateGroups(groups, changes, keyExtractor);

            // After removing indices 1 and 2:
            // Scope 0: [0, 1] -> remove 1 -> [0]
            // Scope 1: [2, 3] -> remove 2, shift 3->1 -> [1]
            expect(groups[0].datumIndices[0]).toEqual([0]);
            expect(groups[0].datumIndices[1]).toEqual([1]); // was [3], now [1]
        });
    });

    describe('performance tests', () => {
        // Helper to create large test data sets
        function createLargeGroup(size: number, startIndex = 0): DataGroup {
            const indices = Array.from({ length: size }, (_, i) => startIndex + i);
            return createGroup(['Large', 'Group'], [indices]);
        }

        it('should handle large groups efficiently - removals', () => {
            const largeGroupSize = 5000;
            const groups = [createLargeGroup(largeGroupSize)];

            // Remove every 10th element (500 removals)
            const builder = DataChangeDescriptorBuilder.create();
            for (let i = 0; i < largeGroupSize; i += 10) {
                builder.addRemoval(i, createTestDatum('Large', 'Group', i));
            }
            const changes = builder.build();
            const keyExtractor = createKeyExtractor();

            const startTime = performance.now();
            GroupUpdater.updateGroups(groups, changes, keyExtractor);
            const endTime = performance.now();

            // Verify correctness
            expect(groups).toHaveLength(1);
            expect(groups[0].datumIndices[0]).toHaveLength(largeGroupSize - 500);

            // Verify indices are still sorted
            const indices = groups[0].datumIndices[0];
            for (let i = 1; i < indices.length; i++) {
                expect(indices[i]).toBeGreaterThan(indices[i - 1]);
            }

            // Performance check - should complete within reasonable time
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle large groups efficiently - insertions', () => {
            const initialSize = 2000;
            const groups = [createLargeGroup(initialSize)];

            // Insert 1000 new elements
            const builder = DataChangeDescriptorBuilder.create();
            for (let i = 0; i < 1000; i++) {
                builder.addInsertion(initialSize + i, createTestDatum('Large', 'Group', initialSize + i));
            }
            const changes = builder.build();
            const keyExtractor = createKeyExtractor();

            const startTime = performance.now();
            GroupUpdater.updateGroups(groups, changes, keyExtractor);
            const endTime = performance.now();

            // Verify correctness
            expect(groups).toHaveLength(1);
            expect(groups[0].datumIndices[0]).toHaveLength(initialSize + 1000);

            // Verify indices are still sorted
            const indices = groups[0].datumIndices[0];
            for (let i = 1; i < indices.length; i++) {
                expect(indices[i]).toBeGreaterThan(indices[i - 1]);
            }

            const duration = endTime - startTime;
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle mixed operations on large groups', () => {
            const initialSize = 3000;
            const groups = [createLargeGroup(initialSize, 0), createLargeGroup(initialSize, initialSize)];

            // Mixed operations: 100 removals, 100 insertions, 50 updates
            const builder = DataChangeDescriptorBuilder.create();

            // Removals: every 30th element
            for (let i = 0; i < initialSize; i += 30) {
                builder.addRemoval(i, createTestDatum('Large', 'Group', i));
            }

            // Insertions: after existing data
            for (let i = 0; i < 100; i++) {
                builder.addInsertion(initialSize * 2 + i, createTestDatum('New', 'Group', i));
            }

            // Updates: change group membership for some items (avoid multiples of 30)
            for (let i = 1001; i < 1051; i++) {
                // Skip indices that are multiples of 30 to avoid removal conflicts
                if (i % 30 !== 0) {
                    builder.addUpdate(i, createTestDatum('Large', 'Group', i), createTestDatum('Updated', 'Group', i));
                }
            }

            const changes = builder.build();
            const keyExtractor = createKeyExtractor();

            const startTime = performance.now();
            GroupUpdater.updateGroups(groups, changes, keyExtractor);
            const endTime = performance.now();

            // Verify groups were created/modified correctly
            expect(groups.length).toBeGreaterThanOrEqual(2); // Should have new groups

            // Find the different groups
            const largeGroup = groups.find((g) => g.keys[0] === 'Large');
            const newGroup = groups.find((g) => g.keys[0] === 'New');
            const updatedGroup = groups.find((g) => g.keys[0] === 'Updated');

            expect(largeGroup).toBeDefined();
            expect(newGroup).toBeDefined();
            expect(updatedGroup).toBeDefined();

            // Verify all groups have sorted indices
            for (const group of groups) {
                const indices = group.datumIndices[0];
                for (let i = 1; i < indices.length; i++) {
                    expect(indices[i]).toBeGreaterThan(indices[i - 1]);
                }
            }

            const duration = endTime - startTime;
            expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
        });

        it('should maintain performance with very large groups (10k+ indices)', () => {
            const largeGroupSize = 10000;
            const groups = [createLargeGroup(largeGroupSize)];

            // Remove 1000 scattered elements
            const builder = DataChangeDescriptorBuilder.create();
            for (let i = 0; i < 1000; i++) {
                const indexToRemove = Math.floor(Math.random() * largeGroupSize);
                try {
                    builder.addRemoval(indexToRemove, createTestDatum('Large', 'Group', indexToRemove));
                } catch {
                    // Skip duplicate removals
                }
            }
            const changes = builder.build();
            const keyExtractor = createKeyExtractor();

            const startTime = performance.now();
            GroupUpdater.updateGroups(groups, changes, keyExtractor);
            const endTime = performance.now();

            // Verify basic correctness
            expect(groups).toHaveLength(1);
            expect(groups[0].datumIndices[0].length).toBeLessThanOrEqual(largeGroupSize);

            // Verify indices are still sorted
            const indices = groups[0].datumIndices[0];
            for (let i = 1; i < indices.length; i++) {
                expect(indices[i]).toBeGreaterThan(indices[i - 1]);
            }

            // Performance should scale reasonably
            const duration = endTime - startTime;
            expect(duration).toBeLessThan(3000); // Should complete within 3 seconds even for 10k items
        });
    });
});
