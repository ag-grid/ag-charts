import { describe, expect, it } from '@jest/globals';

import { DataChangeDescriptorBuilder } from './dataChangeDescriptor';

describe('DataChangeDescriptor', () => {
    describe('DataChangeDescriptorBuilder', () => {
        describe('basic creation', () => {
            it('should create empty descriptor', () => {
                const builder = DataChangeDescriptorBuilder.create();
                expect(builder.isEmpty()).toBe(true);

                const descriptor = builder.build();
                expect(descriptor.removed).toEqual([]);
                expect(descriptor.inserted).toEqual([]);
                expect(descriptor.updated).toEqual([]);
                expect(descriptor.indexShiftRanges).toEqual([]);
                expect(descriptor.metadata).toEqual({
                    totalRemoved: 0,
                    totalInserted: 0,
                    totalUpdated: 0,
                    netSizeChange: 0,
                });
            });

            it('should create descriptor with single removal', () => {
                const builder = DataChangeDescriptorBuilder.create().addRemoval(2, { id: 'item2' });

                expect(builder.isEmpty()).toBe(false);

                const descriptor = builder.build();
                expect(descriptor.removed).toEqual([{ index: 2, datum: { id: 'item2' } }]);
                expect(descriptor.inserted).toEqual([]);
                expect(descriptor.updated).toEqual([]);
                expect(descriptor.metadata.totalRemoved).toBe(1);
                expect(descriptor.metadata.netSizeChange).toBe(-1);
            });

            it('should create descriptor with single insertion', () => {
                const builder = DataChangeDescriptorBuilder.create().addInsertion(1, { id: 'newItem' });

                const descriptor = builder.build();
                expect(descriptor.removed).toEqual([]);
                expect(descriptor.inserted).toEqual([{ index: 1, datum: { id: 'newItem' } }]);
                expect(descriptor.updated).toEqual([]);
                expect(descriptor.metadata.totalInserted).toBe(1);
                expect(descriptor.metadata.netSizeChange).toBe(1);
            });

            it('should create descriptor with single update', () => {
                const oldDatum = { id: 'item1', value: 10 };
                const newDatum = { id: 'item1', value: 20 };
                const builder = DataChangeDescriptorBuilder.create().addUpdate(0, oldDatum, newDatum);

                const descriptor = builder.build();
                expect(descriptor.removed).toEqual([]);
                expect(descriptor.inserted).toEqual([]);
                expect(descriptor.updated).toEqual([
                    {
                        index: 0,
                        oldDatum,
                        newDatum,
                    },
                ]);
                expect(descriptor.metadata.totalUpdated).toBe(1);
                expect(descriptor.metadata.netSizeChange).toBe(0);
            });
        });

        describe('multiple operations', () => {
            it('should handle multiple removals', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(3, { id: 'item3' })
                    .addRemoval(1, { id: 'item1' })
                    .addRemoval(5, { id: 'item5' });

                const descriptor = builder.build();
                // Should be sorted by index
                expect(descriptor.removed).toEqual([
                    { index: 1, datum: { id: 'item1' } },
                    { index: 3, datum: { id: 'item3' } },
                    { index: 5, datum: { id: 'item5' } },
                ]);
                expect(descriptor.metadata.totalRemoved).toBe(3);
            });

            it('should handle multiple insertions', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addInsertion(2, { id: 'new2' })
                    .addInsertion(0, { id: 'new0' })
                    .addInsertion(4, { id: 'new4' });

                const descriptor = builder.build();
                // Should be sorted by index
                expect(descriptor.inserted).toEqual([
                    { index: 0, datum: { id: 'new0' } },
                    { index: 2, datum: { id: 'new2' } },
                    { index: 4, datum: { id: 'new4' } },
                ]);
                expect(descriptor.metadata.totalInserted).toBe(3);
            });

            it('should handle mixed operations', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, { id: 'removed1' })
                    .addInsertion(0, { id: 'inserted0' })
                    .addUpdate(3, { id: 'old3' }, { id: 'new3' })
                    .addRemoval(5, { id: 'removed5' })
                    .addInsertion(2, { id: 'inserted2' });

                const descriptor = builder.build();
                expect(descriptor.removed.length).toBe(2);
                expect(descriptor.inserted.length).toBe(2);
                expect(descriptor.updated.length).toBe(1);
                expect(descriptor.metadata.netSizeChange).toBe(0); // 2 insertions - 2 removals
            });
        });

        describe('validation', () => {
            it('should reject negative indices for removals', () => {
                const builder = DataChangeDescriptorBuilder.create();
                expect(() => builder.addRemoval(-1, {})).toThrow('Removal index cannot be negative');
            });

            it('should reject negative indices for insertions', () => {
                const builder = DataChangeDescriptorBuilder.create();
                expect(() => builder.addInsertion(-1, {})).toThrow('Insertion index cannot be negative');
            });

            it('should reject negative indices for updates', () => {
                const builder = DataChangeDescriptorBuilder.create();
                expect(() => builder.addUpdate(-1, {}, {})).toThrow('Update index cannot be negative');
            });

            it('should reject duplicate removal indices', () => {
                const builder = DataChangeDescriptorBuilder.create().addRemoval(2, { id: 'first' });

                expect(() => builder.addRemoval(2, { id: 'second' })).toThrow('Duplicate removal at index 2');
            });

            it('should reject duplicate update indices', () => {
                const builder = DataChangeDescriptorBuilder.create().addUpdate(1, { old: 'value1' }, { new: 'value1' });

                expect(() => builder.addUpdate(1, { old: 'value2' }, { new: 'value2' })).toThrow(
                    'Duplicate update at index 1'
                );
            });

            it('should reject removal and update at same index', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(3, { id: 'removed' })
                    .addUpdate(3, { old: 'value' }, { new: 'value' });

                expect(() => builder.build()).toThrow('Index 3 cannot be both removed and updated');
            });

            it('should allow insertion at same index as removal (replacement scenario)', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(2, { id: 'removed' })
                    .addInsertion(2, { id: 'inserted' });

                // Should not throw
                expect(() => builder.build()).not.toThrow();
            });
        });

        describe('index shift range computation', () => {
            it('should handle no operations', () => {
                const builder = DataChangeDescriptorBuilder.create();
                const descriptor = builder.build();
                expect(descriptor.indexShiftRanges).toEqual([]);
            });

            it('should compute shift for single removal', () => {
                const builder = DataChangeDescriptorBuilder.create().addRemoval(2, { id: 'item2' });

                const descriptor = builder.build();
                expect(descriptor.indexShiftRanges).toEqual([
                    {
                        startIndex: 3,
                        endIndex: Number.MAX_SAFE_INTEGER,
                        shift: -1,
                    },
                ]);
            });

            it('should compute shift for single insertion', () => {
                const builder = DataChangeDescriptorBuilder.create().addInsertion(1, { id: 'newItem' });

                const descriptor = builder.build();
                expect(descriptor.indexShiftRanges).toEqual([
                    {
                        startIndex: 2, // After insertion at index 1
                        endIndex: Number.MAX_SAFE_INTEGER,
                        shift: 1,
                    },
                ]);
            });

            it('should compute shifts for multiple removals', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, { id: 'item1' })
                    .addRemoval(3, { id: 'item3' })
                    .addRemoval(5, { id: 'item5' });

                const descriptor = builder.build();
                expect(descriptor.indexShiftRanges).toEqual([
                    { startIndex: 2, endIndex: 3, shift: -1 },
                    { startIndex: 4, endIndex: 5, shift: -2 },
                    { startIndex: 6, endIndex: Number.MAX_SAFE_INTEGER, shift: -3 },
                ]);
            });

            it('should compute shifts for multiple insertions', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addInsertion(1, { id: 'new1' })
                    .addInsertion(3, { id: 'new3' })
                    .addInsertion(5, { id: 'new5' });

                const descriptor = builder.build();
                expect(descriptor.indexShiftRanges).toEqual([
                    { startIndex: 2, endIndex: 3, shift: 1 },
                    { startIndex: 4, endIndex: 5, shift: 2 },
                    { startIndex: 6, endIndex: Number.MAX_SAFE_INTEGER, shift: 3 },
                ]);
            });

            it('should compute shifts for mixed operations', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, { id: 'removed1' }) // -1 shift after index 1
                    .addInsertion(3, { id: 'inserted3' }); // +1 shift after index 3

                const descriptor = builder.build();
                expect(descriptor.indexShiftRanges).toEqual([
                    { startIndex: 2, endIndex: 3, shift: -1 },
                    { startIndex: 4, endIndex: Number.MAX_SAFE_INTEGER, shift: 0 }, // Net effect: 0
                ]);
            });

            it('should handle replacement (removal + insertion at same index)', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(2, { id: 'old' })
                    .addInsertion(2, { id: 'new' });

                const descriptor = builder.build();
                // Net effect should be no shift since we remove and add at same position
                expect(descriptor.indexShiftRanges).toEqual([]);
            });

            it('should optimize contiguous ranges', () => {
                // Remove 3 consecutive items
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, { id: 'item1' })
                    .addRemoval(2, { id: 'item2' })
                    .addRemoval(3, { id: 'item3' });

                const descriptor = builder.build();
                expect(descriptor.indexShiftRanges).toEqual([
                    { startIndex: 2, endIndex: 2, shift: -1 },
                    { startIndex: 3, endIndex: 3, shift: -2 },
                    { startIndex: 4, endIndex: Number.MAX_SAFE_INTEGER, shift: -3 },
                ]);
            });
        });

        describe('edge cases', () => {
            it('should handle operations at index 0', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(0, { id: 'first' })
                    .addInsertion(0, { id: 'newFirst' });

                const descriptor = builder.build();
                expect(descriptor.removed[0].index).toBe(0);
                expect(descriptor.inserted[0].index).toBe(0);
            });

            it('should handle large indices', () => {
                const largeIndex = 1000000;
                const builder = DataChangeDescriptorBuilder.create().addRemoval(largeIndex, { id: 'large' });

                const descriptor = builder.build();
                expect(descriptor.removed[0].index).toBe(largeIndex);
                expect(descriptor.indexShiftRanges[0].startIndex).toBe(largeIndex + 1);
            });

            it('should handle empty data arrays', () => {
                const builder = DataChangeDescriptorBuilder.create().addInsertion(0, { id: 'firstItem' });

                expect(() => builder.build()).not.toThrow();
                const descriptor = builder.build();
                expect(descriptor.inserted[0].index).toBe(0);
            });

            it('should handle null and undefined data', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(0, null)
                    .addInsertion(1, undefined)
                    .addUpdate(2, null, undefined);

                const descriptor = builder.build();
                expect(descriptor.removed[0].datum).toBe(null);
                expect(descriptor.inserted[0].datum).toBe(undefined);
                expect(descriptor.updated[0].oldDatum).toBe(null);
                expect(descriptor.updated[0].newDatum).toBe(undefined);
            });
        });

        describe('builder pattern usage', () => {
            it('should support method chaining', () => {
                const descriptor = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, { id: 'removed' })
                    .addInsertion(0, { id: 'inserted' })
                    .addUpdate(3, { old: 'value' }, { new: 'value' })
                    .build();

                expect(descriptor.removed.length).toBe(1);
                expect(descriptor.inserted.length).toBe(1);
                expect(descriptor.updated.length).toBe(1);
            });

            it('should support clearing state', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, { id: 'removed' })
                    .addInsertion(0, { id: 'inserted' })
                    .clear();

                expect(builder.isEmpty()).toBe(true);
                const descriptor = builder.build();
                expect(descriptor.removed.length).toBe(0);
                expect(descriptor.inserted.length).toBe(0);
            });

            it('should support reusing builder after clear', () => {
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, { id: 'removed' })
                    .clear()
                    .addInsertion(2, { id: 'new' });

                const descriptor = builder.build();
                expect(descriptor.removed.length).toBe(0);
                expect(descriptor.inserted.length).toBe(1);
                expect(descriptor.inserted[0].datum.id).toBe('new');
            });

            it('should handle building multiple times', () => {
                const builder = DataChangeDescriptorBuilder.create().addRemoval(1, { id: 'removed' });

                const descriptor1 = builder.build();
                const descriptor2 = builder.build();

                expect(descriptor1).toEqual(descriptor2);
                expect(descriptor1).not.toBe(descriptor2); // Different instances
            });
        });

        describe('complex scenarios', () => {
            it('should handle prepend operations', () => {
                // Simulate prepend: insert multiple items at beginning
                const builder = DataChangeDescriptorBuilder.create()
                    .addInsertion(0, { id: 'prepend1' })
                    .addInsertion(0, { id: 'prepend2' }); // Note: both at index 0

                const descriptor = builder.build();
                expect(descriptor.inserted).toEqual([
                    { index: 0, datum: { id: 'prepend2' } },
                    { index: 0, datum: { id: 'prepend1' } },
                ]);
            });

            it('should handle append operations', () => {
                // Simulate append: insert items at end (high indices)
                const builder = DataChangeDescriptorBuilder.create()
                    .addInsertion(100, { id: 'append1' })
                    .addInsertion(101, { id: 'append2' });

                const descriptor = builder.build();
                expect(descriptor.inserted[0].index).toBe(100);
                expect(descriptor.inserted[1].index).toBe(101);
            });

            it('should handle complex transaction sequence', () => {
                // Remove item 1, update item 3, insert at position 2, remove item 5
                const builder = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, { id: 'item1' })
                    .addUpdate(3, { id: 'item3', value: 10 }, { id: 'item3', value: 20 })
                    .addInsertion(2, { id: 'newItem' })
                    .addRemoval(5, { id: 'item5' });

                const descriptor = builder.build();

                // Verify metadata
                expect(descriptor.metadata).toEqual({
                    totalRemoved: 2,
                    totalInserted: 1,
                    totalUpdated: 1,
                    netSizeChange: -1,
                });

                // Verify operations are sorted
                expect(descriptor.removed.map((r) => r.index)).toEqual([1, 5]);
                expect(descriptor.inserted.map((i) => i.index)).toEqual([2]);
                expect(descriptor.updated.map((u) => u.index)).toEqual([3]);
            });
        });
    });
});
