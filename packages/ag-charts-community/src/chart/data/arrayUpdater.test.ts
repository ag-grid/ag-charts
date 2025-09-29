import { ArrayUpdater } from './arrayUpdater';
import { type DataChangeDescriptor, DataChangeDescriptorBuilder } from './dataChangeDescriptor';

describe('ArrayUpdater', () => {
    describe('applyChanges', () => {
        describe('basic operations', () => {
            it('should handle empty changes', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create().build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 2, 3]);
            });

            it('should handle empty array with no changes', () => {
                const array: number[] = [];
                const changes = DataChangeDescriptorBuilder.create().build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([]);
            });
        });

        describe('removals', () => {
            it('should remove single item', () => {
                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create().addRemoval(2, 3).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 2, 4, 5]);
            });

            it('should remove multiple items in correct order', () => {
                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create().addRemoval(1, 2).addRemoval(3, 4).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 3, 5]);
            });

            it('should remove all items', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(0, 1)
                    .addRemoval(1, 2)
                    .addRemoval(2, 3)
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([]);
            });

            it('should remove from beginning and end', () => {
                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create().addRemoval(0, 1).addRemoval(4, 5).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([2, 3, 4]);
            });

            it('should handle removal from single-item array', () => {
                const array = [42];
                const changes = DataChangeDescriptorBuilder.create().addRemoval(0, 42).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([]);
            });
        });

        describe('insertions', () => {
            it('should insert single item at beginning', () => {
                const array = [2, 3, 4];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(0, 1).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 2, 3, 4]);
            });

            it('should insert single item at end', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(3, 4).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 2, 3, 4]);
            });

            it('should insert single item in middle', () => {
                const array = [1, 3, 4];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(1, 2).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 2, 3, 4]);
            });

            it('should insert multiple items', () => {
                const array = [1, 4];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(1, 2).addInsertion(2, 3).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 2, 3, 4]);
            });

            it('should insert into empty array', () => {
                const array: number[] = [];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(0, 1).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1]);
            });

            it('should insert multiple items at same index', () => {
                const array = [1, 4];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(1, 2).addInsertion(1, 3).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 2, 3, 4]);
            });
        });

        describe('updates', () => {
            it('should update single item', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create().addUpdate(1, 2, 20).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 20, 3]);
            });

            it('should update multiple items', () => {
                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create()
                    .addUpdate(0, 1, 10)
                    .addUpdate(2, 3, 30)
                    .addUpdate(4, 5, 50)
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([10, 2, 30, 4, 50]);
            });

            it('should update all items', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create()
                    .addUpdate(0, 1, 10)
                    .addUpdate(1, 2, 20)
                    .addUpdate(2, 3, 30)
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([10, 20, 30]);
            });

            it('should update single item in single-item array', () => {
                const array = [1];
                const changes = DataChangeDescriptorBuilder.create().addUpdate(0, 1, 42).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([42]);
            });
        });

        describe('combined operations', () => {
            it('should handle removals and insertions', () => {
                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, 2)
                    .addRemoval(3, 4)
                    .addInsertion(1, 10)
                    .addInsertion(3, 20)
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 10, 3, 20, 5]);
            });

            it('should handle removals and updates', () => {
                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, 2)
                    .addUpdate(2, 3, 30)
                    .addUpdate(4, 5, 50)
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 30, 4, 50]);
            });

            it('should handle insertions and updates', () => {
                const array = [1, 3, 5];
                const changes = DataChangeDescriptorBuilder.create()
                    .addUpdate(1, 3, 30)
                    .addInsertion(1, 2)
                    .addInsertion(3, 4)
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 2, 30, 4, 5]);
            });

            it('should handle all three operations', () => {
                const array = [1, 2, 3, 4, 5];
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, 2)
                    .addUpdate(2, 3, 30)
                    .addInsertion(1, 10)
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 10, 30, 4, 5]);
            });

            it('should handle complex scenario with multiple operations', () => {
                const array = [1, 2, 3, 4, 5, 6, 7, 8];
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(1, 2) // Remove 2
                    .addRemoval(5, 6) // Remove 6
                    .addUpdate(2, 3, 30) // Update 3 to 30
                    .addUpdate(6, 7, 70) // Update 7 to 70
                    .addInsertion(1, 15) // Insert 15 at position 1
                    .addInsertion(4, 45) // Insert 45 at position 4
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 15, 30, 4, 45, 5, 70, 8]);
            });
        });

        describe('extractor function', () => {
            interface TestData {
                id: number;
                value: string;
            }

            it('should use extractor for insertions', () => {
                const array: TestData[] = [
                    { id: 1, value: 'one' },
                    { id: 3, value: 'three' },
                ];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(1, { id: 2, value: 'two' }).build();

                const extractor = (datum: any) => ({ id: datum.id, value: datum.value.toUpperCase() });

                ArrayUpdater.applyChanges(array, changes, extractor);

                expect(array).toEqual([
                    { id: 1, value: 'one' },
                    { id: 2, value: 'TWO' },
                    { id: 3, value: 'three' },
                ]);
            });

            it('should use extractor for updates', () => {
                const array: TestData[] = [
                    { id: 1, value: 'one' },
                    { id: 2, value: 'two' },
                    { id: 3, value: 'three' },
                ];
                const changes = DataChangeDescriptorBuilder.create()
                    .addUpdate(1, { id: 2, value: 'two' }, { id: 2, value: 'updated' })
                    .build();

                const extractor = (datum: any) => ({ id: datum.id, value: datum.value.toUpperCase() });

                ArrayUpdater.applyChanges(array, changes, extractor);

                expect(array).toEqual([
                    { id: 1, value: 'one' },
                    { id: 2, value: 'UPDATED' },
                    { id: 3, value: 'three' },
                ]);
            });

            it('should use extractor with index parameter', () => {
                const array: number[] = [10, 20, 30];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(1, 100).addUpdate(2, 30, 200).build();

                const extractor = (datum: any, index: number) => datum + index;

                ArrayUpdater.applyChanges(array, changes, extractor);

                expect(array).toEqual([10, 101, 202, 30]); // 100+1, 200+2
            });

            it('should work without extractor', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create().addInsertion(1, 5).addUpdate(2, 3, 6).build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([1, 5, 6, 3]);
            });
        });

        describe('edge cases', () => {
            it('should handle operations on array boundaries', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(0, 1) // Remove first
                    .addRemoval(2, 3) // Remove last (original index)
                    .addInsertion(0, 0) // Insert at beginning
                    .addInsertion(2, 4) // Insert at end
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual([0, 2, 4]);
            });

            it('should handle large arrays efficiently', () => {
                const size = 10000;
                const array = Array.from({ length: size }, (_, i) => i);
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(0, 0) // Remove first
                    .addRemoval(size - 1, size - 1) // Remove last
                    .addInsertion(0, -1) // Insert at beginning
                    .addInsertion(size - 1, size) // Insert at end
                    .build();

                const startTime = performance.now();
                ArrayUpdater.applyChanges(array, changes);
                const endTime = performance.now();

                expect(array.length).toBe(size);
                expect(array[0]).toBe(-1);
                expect(array[array.length - 1]).toBe(size);
                expect(endTime - startTime).toBeLessThan(100); // Should be fast
            });

            it('should maintain array type consistency', () => {
                const array: string[] = ['a', 'b', 'c'];
                const changes = DataChangeDescriptorBuilder.create()
                    .addInsertion(1, 'd')
                    .addUpdate(2, 'c', 'e')
                    .build();

                ArrayUpdater.applyChanges(array, changes);

                expect(array).toEqual(['a', 'd', 'e', 'c']);
                expect(array.every((item) => typeof item === 'string')).toBe(true);
            });
        });

        describe('error handling', () => {
            it('should throw error for invalid array parameter', () => {
                const changes = DataChangeDescriptorBuilder.create().build();

                expect(() => {
                    ArrayUpdater.applyChanges(null as any, changes);
                }).toThrow('Array parameter must be an array');

                expect(() => {
                    ArrayUpdater.applyChanges(undefined as any, changes);
                }).toThrow('Array parameter must be an array');

                expect(() => {
                    ArrayUpdater.applyChanges('not an array' as any, changes);
                }).toThrow('Array parameter must be an array');
            });

            it('should throw error for missing changes parameter', () => {
                const array = [1, 2, 3];

                expect(() => {
                    ArrayUpdater.applyChanges(array, null as any);
                }).toThrow('Changes parameter is required');

                expect(() => {
                    ArrayUpdater.applyChanges(array, undefined as any);
                }).toThrow('Changes parameter is required');
            });

            it('should throw error for out-of-bounds removal index', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create().addRemoval(5, 'invalid').build();

                expect(() => {
                    ArrayUpdater.applyChanges(array, changes);
                }).toThrow('Removal index 5 is out of bounds for array of length 3');
            });

            it('should throw error for negative removal index', () => {
                const array = [1, 2, 3];
                const changes = {
                    removed: [{ index: -1, datum: 'invalid' }],
                    inserted: [],
                    updated: [],
                    indexShiftRanges: [],
                    metadata: {
                        totalRemoved: 1,
                        totalInserted: 0,
                        totalUpdated: 0,
                        netSizeChange: -1,
                    },
                } as DataChangeDescriptor;

                expect(() => {
                    ArrayUpdater.applyChanges(array, changes);
                }).toThrow('Removal index -1 is out of bounds for array of length 3');
            });

            it('should throw error for out-of-bounds update index', () => {
                const array = [1, 2, 3];
                const changes = DataChangeDescriptorBuilder.create().addUpdate(5, 'old', 'new').build();

                expect(() => {
                    ArrayUpdater.applyChanges(array, changes);
                }).toThrow('Update index 5 is out of bounds for array of length 3');
            });

            it('should throw error for update on removed index', () => {
                const array = [1, 2, 3];
                const changes = {
                    removed: [{ index: 1, datum: 2 }],
                    inserted: [],
                    updated: [{ index: 1, oldDatum: 2, newDatum: 'updated' }],
                    indexShiftRanges: [],
                    metadata: {
                        totalRemoved: 1,
                        totalInserted: 0,
                        totalUpdated: 1,
                        netSizeChange: -1,
                    },
                } as DataChangeDescriptor;

                expect(() => {
                    ArrayUpdater.applyChanges(array, changes);
                }).toThrow('Cannot update index 1 that is marked for removal');
            });
        });
    });

    describe('applyChangesToCopy', () => {
        it('should create a copy and apply changes', () => {
            const original = [1, 2, 3, 4, 5];
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(1, 2)
                .addInsertion(2, 10)
                .addUpdate(3, 4, 40)
                .build();

            const result = ArrayUpdater.applyChangesToCopy(original, changes);

            expect(original).toEqual([1, 2, 3, 4, 5]); // Original unchanged
            expect(result).toEqual([1, 3, 10, 40, 5]); // Copy modified
        });

        it('should work with extractor function', () => {
            const original = [1, 2, 3];
            const changes = DataChangeDescriptorBuilder.create().addInsertion(1, 10).build();

            const extractor = (datum: any) => datum * 2;
            const result = ArrayUpdater.applyChangesToCopy(original, changes, extractor);

            expect(original).toEqual([1, 2, 3]); // Original unchanged
            expect(result).toEqual([1, 20, 2, 3]); // Copy modified with extractor
        });
    });

    describe('calculateFinalLength', () => {
        it('should calculate correct length for various changes', () => {
            const changes1 = DataChangeDescriptorBuilder.create().addRemoval(0, 'a').addInsertion(1, 'b').build();
            expect(ArrayUpdater.calculateFinalLength(5, changes1)).toBe(5); // -1 +1 = 0

            const changes2 = DataChangeDescriptorBuilder.create()
                .addRemoval(0, 'a')
                .addRemoval(1, 'b')
                .addInsertion(2, 'c')
                .build();
            expect(ArrayUpdater.calculateFinalLength(5, changes2)).toBe(4); // -2 +1 = -1

            const changes3 = DataChangeDescriptorBuilder.create()
                .addInsertion(0, 'a')
                .addInsertion(1, 'b')
                .addInsertion(2, 'c')
                .build();
            expect(ArrayUpdater.calculateFinalLength(5, changes3)).toBe(8); // +3
        });

        it('should handle empty changes', () => {
            const changes = DataChangeDescriptorBuilder.create().build();
            expect(ArrayUpdater.calculateFinalLength(10, changes)).toBe(10);
        });
    });

    describe('validateChanges', () => {
        it('should validate correct changes', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addRemoval(0, 'a')
                .addUpdate(1, 'b', 'B')
                .addInsertion(2, 'c')
                .build();

            expect(ArrayUpdater.validateChanges(3, changes)).toBe(true);
        });

        it('should throw error for invalid removal index', () => {
            const changes = DataChangeDescriptorBuilder.create().addRemoval(5, 'invalid').build();

            expect(() => {
                ArrayUpdater.validateChanges(3, changes);
            }).toThrow('Removal index 5 is out of bounds for array of length 3');
        });

        it('should throw error for invalid update index', () => {
            const changes = DataChangeDescriptorBuilder.create().addUpdate(5, 'old', 'new').build();

            expect(() => {
                ArrayUpdater.validateChanges(3, changes);
            }).toThrow('Update index 5 is out of bounds for array of length 3');
        });

        it('should throw error for update on removed index', () => {
            const changes = {
                removed: [{ index: 1, datum: 'removed' }],
                inserted: [],
                updated: [{ index: 1, oldDatum: 'old', newDatum: 'new' }],
                indexShiftRanges: [],
                metadata: {
                    totalRemoved: 1,
                    totalInserted: 0,
                    totalUpdated: 1,
                    netSizeChange: -1,
                },
            } as DataChangeDescriptor;

            expect(() => {
                ArrayUpdater.validateChanges(3, changes);
            }).toThrow('Cannot update index 1 that is marked for removal');
        });

        it('should validate insertion indices correctly', () => {
            const changes = DataChangeDescriptorBuilder.create()
                .addInsertion(0, 'a')
                .addInsertion(4, 'b') // Final length will be 4, so index 4 is valid
                .build();

            expect(ArrayUpdater.validateChanges(3, changes)).toBe(true);
        });

        it('should throw error for invalid insertion index', () => {
            const changes = DataChangeDescriptorBuilder.create().addInsertion(10, 'invalid').build();

            expect(() => {
                ArrayUpdater.validateChanges(3, changes);
            }).toThrow('Insertion index 10 would be out of bounds for final array length 4');
        });
    });

    describe('performance characteristics', () => {
        it('should handle large arrays with many operations efficiently', () => {
            const size = 1000;
            const array = Array.from({ length: size }, (_, i) => i);

            const builder = DataChangeDescriptorBuilder.create();

            // Add many removals, updates, and insertions
            for (let i = 0; i < 100; i++) {
                if (i % 3 === 0) {
                    builder.addRemoval(i * 2, array[i * 2]);
                } else if (i % 3 === 1 && i * 2 < size) {
                    builder.addUpdate(i * 2, array[i * 2], array[i * 2] * 10);
                } else {
                    builder.addInsertion(i, i * 1000);
                }
            }

            const changes = builder.build();

            const startTime = performance.now();
            ArrayUpdater.applyChanges(array, changes);
            const endTime = performance.now();

            // Should complete in reasonable time
            expect(endTime - startTime).toBeLessThan(50);
            expect(Array.isArray(array)).toBe(true);
        });

        it('should maintain O(n) complexity for typical operations', () => {
            const sizes = [100, 500, 1000];
            const times: number[] = [];

            for (const size of sizes) {
                const array = Array.from({ length: size }, (_, i) => i);
                const changes = DataChangeDescriptorBuilder.create()
                    .addRemoval(0, 0)
                    .addInsertion(size - 1, -1)
                    .addUpdate(Math.floor(size / 2), size / 2, -size / 2)
                    .build();

                const startTime = performance.now();
                ArrayUpdater.applyChanges(array, changes);
                const endTime = performance.now();

                times.push(endTime - startTime);
            }

            // Time should scale roughly linearly (allowing for some variance)
            // This is a basic sanity check - not a rigorous complexity analysis
            expect(times.every((time) => time < 20)).toBe(true);
        });
    });
});
