import { describe, expect, test } from 'vitest';

import { _ModuleSupport } from 'ag-charts-community';
import { expectWarningMessages, setupMockConsole } from 'ag-charts-community-test';
import { testLogger } from 'ag-charts-test';

import { HierarchyDataSet } from './hierarchyDataSet';

interface TreeItem {
    id: string;
    name: string;
    value?: number;
    children?: TreeItem[];
}

function createTestData(): TreeItem[] {
    return [
        {
            id: 'eng',
            name: 'Engineering',
            children: [
                { id: 'eng-fe', name: 'Frontend', value: 25 },
                { id: 'eng-be', name: 'Backend', value: 30 },
                { id: 'eng-infra', name: 'Infrastructure', value: 15 },
            ],
        },
        {
            id: 'sales',
            name: 'Sales',
            children: [
                { id: 'sales-na', name: 'North America', value: 20 },
                { id: 'sales-eu', name: 'Europe', value: 15 },
            ],
        },
        {
            id: 'ops',
            name: 'Operations',
            children: [{ id: 'ops-hr', name: 'HR', value: 8 }],
        },
    ];
}

/**
 * Stand-in for a per-series selection bitset. Mirrors `DataSetSelection.applyDataChange` — it
 * feeds the change description through `applyToTypedArray`, which is exactly where the original
 * hierarchy `RangeError` was thrown — without coupling these tests to the data-selection module.
 */
class BitsetSelection {
    selection: Uint8Array;

    constructor(length: number) {
        this.selection = new Uint8Array(length);
    }

    select(index: number): void {
        this.selection[index] = 1;
    }

    onDataChange(changeDescription: _ModuleSupport.DataChangeDescription): void {
        this.selection = changeDescription.applyToTypedArray(this.selection);
    }

    selectedIndices(): number[] {
        const indices: number[] = [];
        for (let i = 0; i < this.selection.length; i++) {
            if (this.selection[i] === 1) indices.push(i);
        }
        return indices;
    }
}

describe('HierarchyDataSet', () => {
    setupMockConsole();

    describe('dataIdKey validation', () => {
        test('warns when dataIdKey field is not found on any data item', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'nonExistent', 'children', testLogger);
            ds.addTransaction({ remove: [{ nonExistent: 'x' } as any] });
            ds.commitPendingTransactions(undefined);
            expectWarningMessages(["AG Charts - dataIdKey 'nonExistent' was not found on any data item."]);
        });

        test('does not warn when dataIdKey field exists on data items', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);
            ds.addTransaction({ update: [{ id: 'eng-fe', name: 'Frontend', value: 50 }] });
            ds.commitPendingTransactions(undefined);
            expect(ds.data[0].children![0].value).toBe(50);
            expectWarningMessages([]);
        });
    });

    describe('update by ID', () => {
        test('should update a root-level item', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const updatedEng = { ...data[0], name: 'Engineering Dept' };
            ds.addTransaction({ update: [updatedEng] });
            ds.commitPendingTransactions(undefined);

            expect(ds.data[0].name).toBe('Engineering Dept');
            expect(ds.data.length).toBe(3);
        });

        test('should update a nested leaf item in-place', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const updatedLeaf = { id: 'eng-fe', name: 'Frontend', value: 50 };
            ds.addTransaction({ update: [updatedLeaf] });
            ds.commitPendingTransactions(undefined);

            // Root array unchanged
            expect(ds.data.length).toBe(3);
            // Nested item updated in-place
            expect(ds.data[0].children![0].value).toBe(50);
        });

        test('should update multiple nested items across different parents', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            ds.addTransaction({
                update: [
                    { id: 'eng-be', name: 'Backend', value: 99 },
                    { id: 'sales-eu', name: 'Europe', value: 77 },
                ],
            });
            ds.commitPendingTransactions(undefined);

            expect(ds.data[0].children![1].value).toBe(99);
            expect(ds.data[1].children![1].value).toBe(77);
            expect(ds.data.length).toBe(3);
        });
    });

    describe('remove by ID', () => {
        test('should remove a root-level item', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            ds.addTransaction({ remove: [{ id: 'ops' } as TreeItem] });
            ds.commitPendingTransactions(undefined);

            expect(ds.data.length).toBe(2);
            expect(ds.data.map((d) => d.id)).toEqual(['eng', 'sales']);
        });

        test('should remove a nested leaf item', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            ds.addTransaction({ remove: [{ id: 'eng-infra' } as TreeItem] });
            ds.commitPendingTransactions(undefined);

            // Root array unchanged
            expect(ds.data.length).toBe(3);
            // Nested item removed
            expect(ds.data[0].children!.length).toBe(2);
            expect(ds.data[0].children!.map((c) => c.id)).toEqual(['eng-fe', 'eng-be']);
        });

        test('should remove multiple nested items', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            ds.addTransaction({
                remove: [{ id: 'eng-fe' } as TreeItem, { id: 'sales-na' } as TreeItem],
            });
            ds.commitPendingTransactions(undefined);

            expect(ds.data[0].children!.length).toBe(2);
            expect(ds.data[1].children!.length).toBe(1);
        });
    });

    describe('add with nested deduplication', () => {
        test('should not duplicate items already nested in the tree', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            // Simulate user manually adding to children, then calling applyTransaction
            const newLeaf = { id: 'eng-new', name: 'New Team', value: 10 };
            data[0].children!.push(newLeaf);
            ds.addTransaction({ add: [newLeaf] });
            ds.commitPendingTransactions(undefined);

            // Should NOT appear at root level (only in children)
            expect(ds.data.length).toBe(3);
            expect(ds.data[0].children!.length).toBe(4);
            expect(ds.data[0].children![3].id).toBe('eng-new');
        });

        test('should allow adding genuinely new root-level items', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const newDept = { id: 'marketing', name: 'Marketing', children: [] };
            ds.addTransaction({ add: [newDept] });
            ds.commitPendingTransactions(undefined);

            expect(ds.data.length).toBe(4);
            expect(ds.data[3].id).toBe('marketing');
        });

        test('should handle add + manual nested push in same transaction', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            // Add two items: one genuinely new root, one already nested
            const nestedLeaf = { id: 'ops-it', name: 'IT', value: 6 };
            data[2].children!.push(nestedLeaf);

            const newRoot = { id: 'legal', name: 'Legal Dept', children: [] };

            ds.addTransaction({ add: [nestedLeaf, newRoot] });
            ds.commitPendingTransactions(undefined);

            // nestedLeaf should not appear at root (it's nested under ops)
            // newRoot should appear at root
            expect(ds.data.length).toBe(4);
            expect(ds.data[3].id).toBe('legal');
            expect(ds.data[2].children!.length).toBe(2);
            expect(ds.data[2].children![1].id).toBe('ops-it');
        });
    });

    describe('mixed operations', () => {
        test('should handle update + remove in same transaction', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            ds.addTransaction({
                update: [{ id: 'eng-fe', name: 'Frontend', value: 100 }],
                remove: [{ id: 'eng-infra' } as TreeItem],
            });
            ds.commitPendingTransactions(undefined);

            expect(ds.data[0].children![0].value).toBe(100);
            expect(ds.data[0].children!.length).toBe(2);
            expect(ds.data[0].children!.map((c) => c.id)).toEqual(['eng-fe', 'eng-be']);
        });
    });

    describe('sequential transactions', () => {
        test('should update nested items correctly across multiple commits', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            // First transaction: update eng-fe
            ds.addTransaction({ update: [{ id: 'eng-fe', name: 'Frontend', value: 50 }] });
            ds.commitPendingTransactions(undefined);
            expect(ds.data[0].children![0].value).toBe(50);

            // Second transaction: update eng-be (exercises cache rebuild after first commit)
            ds.addTransaction({ update: [{ id: 'eng-be', name: 'Backend', value: 99 }] });
            ds.commitPendingTransactions(undefined);
            expect(ds.data[0].children![0].value).toBe(50);
            expect(ds.data[0].children![1].value).toBe(99);
            expect(ds.data.length).toBe(3);
        });

        test('should handle remove then update across commits', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            // First: remove a nested item
            ds.addTransaction({ remove: [{ id: 'eng-infra' } as TreeItem] });
            ds.commitPendingTransactions(undefined);
            expect(ds.data[0].children!.length).toBe(2);

            // Second: update a remaining nested item (cache must reflect removal)
            ds.addTransaction({ update: [{ id: 'eng-be', name: 'Backend', value: 200 }] });
            ds.commitPendingTransactions(undefined);
            expect(ds.data[0].children![1].value).toBe(200);
            expect(ds.data[0].children!.length).toBe(2);
        });

        test('should handle add-with-dedup then update across commits', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            // First: add nested + deduplicate
            const newLeaf = { id: 'eng-new', name: 'New Team', value: 10 };
            data[0].children!.push(newLeaf);
            ds.addTransaction({ add: [newLeaf] });
            ds.commitPendingTransactions(undefined);
            expect(ds.data.length).toBe(3);

            // Second: update the newly added nested item (cache must be valid after dedup splice)
            ds.addTransaction({ update: [{ id: 'eng-new', name: 'New Team', value: 42 }] });
            ds.commitPendingTransactions(undefined);
            expect(ds.data[0].children![3].value).toBe(42);
            expect(ds.data.length).toBe(3);
        });
    });

    describe('manual mutation + transaction remove', () => {
        test('should silently ignore remove of an item already manually spliced from children', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            // Simulate the QA pattern: user directly removes from children array,
            // then also calls applyTransaction({ remove }) — item is already gone
            const removed = data[0].children!.splice(2, 1)[0]; // remove 'eng-infra' in-place
            expect(data[0].children!.length).toBe(2);

            // This should NOT emit a warning and should leave data consistent
            ds.addTransaction({ remove: [removed] });
            ds.commitPendingTransactions(undefined);

            expect(ds.data.length).toBe(3);
            expect(ds.data[0].children!.length).toBe(2);
            expect(ds.data[0].children!.map((c) => c.id)).toEqual(['eng-fe', 'eng-be']);
        });
    });

    describe('mid-index (addIndex) insert then remove', () => {
        test('should correctly cancel a mid-index add when removed in the same commit', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            // Add at addIndex=1 → goes into trackedInsertions (not prepend/append)
            const newDept = { id: 'new-mid', name: 'Mid Dept', children: [] };
            ds.addTransaction({ add: [newDept], addIndex: 1 });
            // Remove the same item before committing
            ds.addTransaction({ remove: [newDept] });
            ds.commitPendingTransactions(undefined);

            // Net result: no change — item should not appear in data
            expect(ds.data.length).toBe(3);
            expect(ds.data.map((d) => d.id)).toEqual(['eng', 'sales', 'ops']);
        });

        test('should correctly add at mid-index when not removed', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const newDept = { id: 'new-mid', name: 'Mid Dept', children: [] };
            ds.addTransaction({ add: [newDept], addIndex: 1 });
            ds.commitPendingTransactions(undefined);

            expect(ds.data.length).toBe(4);
            expect(ds.data[1].id).toBe('new-mid');
        });
    });

    describe('without dataIdKey', () => {
        test('should behave like base DataSet when no dataIdKey is set', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, undefined, 'children', testLogger);

            const newItem = { id: 'new', name: 'New', value: 1 };
            ds.addTransaction({ add: [newItem] });
            ds.commitPendingTransactions(undefined);

            // Without dataIdKey, deduplication doesn't apply
            expect(ds.data.length).toBe(4);
        });
    });

    // DFS order of createTestData(): eng(0), eng-fe(1), eng-be(2), eng-infra(3),
    // sales(4), sales-na(5), sales-eu(6), ops(7), ops-hr(8) → size() === 9
    describe('data-selection across transactions', () => {
        test('should not throw and should preserve selection when appending a root node', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const sel = new BitsetSelection(ds.size());
            sel.select(1); // eng-fe
            sel.select(8); // ops-hr
            expect(sel.selection.length).toBe(9);

            // The original RangeError repro: append a new root node with selection enabled.
            ds.addTransaction({ add: [{ id: 'marketing', name: 'Marketing', children: [] }] });
            expect(() => ds.commitPendingTransactions(sel)).not.toThrow();

            // DFS grew to 10; survivors keep their indices, the new node defaults to unselected.
            expect(sel.selection.length).toBe(10);
            expect(sel.selectedIndices()).toEqual([1, 8]);
        });

        test('should drop the removed node and shift survivors when removing a nested leaf', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const sel = new BitsetSelection(ds.size());
            sel.select(1); // eng-fe (removed)
            sel.select(2); // eng-be
            sel.select(8); // ops-hr

            ds.addTransaction({ remove: [{ id: 'eng-fe' } as TreeItem] });
            ds.commitPendingTransactions(sel);

            // New DFS: eng(0), eng-be(1), eng-infra(2), sales(3), sales-na(4),
            // sales-eu(5), ops(6), ops-hr(7). eng-fe drops; eng-be 2→1, ops-hr 8→7.
            expect(sel.selection.length).toBe(8);
            expect(sel.selectedIndices()).toEqual([1, 7]);
        });

        test('should preserve selection when updating a nested node in-place by id', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const sel = new BitsetSelection(ds.size());
            sel.select(1); // eng-fe

            ds.addTransaction({ update: [{ id: 'eng-fe', name: 'Frontend', value: 50 }] });
            ds.commitPendingTransactions(sel);

            // Same id, same position → selection stays put.
            expect(ds.data[0].children![0].value).toBe(50);
            expect(sel.selectedIndices()).toEqual([1]);
        });

        test('should shift later survivors when inserting a nested leaf mid-tree', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const sel = new BitsetSelection(ds.size());
            sel.select(2); // eng-be
            sel.select(8); // ops-hr

            // User adds a child under eng and applies the matching transaction (dedup keeps it nested).
            const engNew = { id: 'eng-new', name: 'New Team', value: 1 };
            data[0].children!.push(engNew);
            ds.addTransaction({ add: [engNew] });
            ds.commitPendingTransactions(sel);

            // New DFS inserts eng-new at index 4: eng(0), eng-fe(1), eng-be(2), eng-infra(3),
            // eng-new(4), sales(5), … ops-hr(9). eng-be stays at 2; ops-hr 8→9.
            expect(sel.selection.length).toBe(10);
            expect(sel.selectedIndices()).toEqual([2, 9]);
        });

        test('should drop a whole subtree contiguously when removing a root group', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children', testLogger);

            const sel = new BitsetSelection(ds.size());
            sel.select(2); // eng-be (survives)
            sel.select(4); // sales (removed)
            sel.select(6); // sales-eu (removed with parent)
            sel.select(8); // ops-hr (survives)

            ds.addTransaction({ remove: [{ id: 'sales' } as TreeItem] });
            ds.commitPendingTransactions(sel);

            // New DFS: eng(0), eng-fe(1), eng-be(2), eng-infra(3), ops(4), ops-hr(5).
            // sales/sales-na/sales-eu drop; eng-be stays at 2, ops-hr 8→5.
            expect(sel.selection.length).toBe(6);
            expect(sel.selectedIndices()).toEqual([2, 5]);
        });
    });
});
