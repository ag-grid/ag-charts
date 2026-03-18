import { describe, expect, test } from '@jest/globals';

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
            children: [
                { id: 'ops-hr', name: 'HR', value: 8 },
            ],
        },
    ];
}

describe('HierarchyDataSet', () => {
    describe('update by ID', () => {
        test('should update a root-level item', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            const updatedEng = { ...data[0], name: 'Engineering Dept' };
            ds.addTransaction({ update: [updatedEng] });
            ds.commitPendingTransactions();

            expect(ds.data[0].name).toBe('Engineering Dept');
            expect(ds.data.length).toBe(3);
        });

        test('should update a nested leaf item in-place', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            const updatedLeaf = { id: 'eng-fe', name: 'Frontend', value: 50 };
            ds.addTransaction({ update: [updatedLeaf] });
            ds.commitPendingTransactions();

            // Root array unchanged
            expect(ds.data.length).toBe(3);
            // Nested item updated in-place
            expect(ds.data[0].children![0].value).toBe(50);
        });

        test('should update multiple nested items across different parents', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            ds.addTransaction({
                update: [
                    { id: 'eng-be', name: 'Backend', value: 99 },
                    { id: 'sales-eu', name: 'Europe', value: 77 },
                ],
            });
            ds.commitPendingTransactions();

            expect(ds.data[0].children![1].value).toBe(99);
            expect(ds.data[1].children![1].value).toBe(77);
            expect(ds.data.length).toBe(3);
        });
    });

    describe('remove by ID', () => {
        test('should remove a root-level item', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            ds.addTransaction({ remove: [{ id: 'ops' } as TreeItem] });
            ds.commitPendingTransactions();

            expect(ds.data.length).toBe(2);
            expect(ds.data.map((d) => d.id)).toEqual(['eng', 'sales']);
        });

        test('should remove a nested leaf item', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            ds.addTransaction({ remove: [{ id: 'eng-infra' } as TreeItem] });
            ds.commitPendingTransactions();

            // Root array unchanged
            expect(ds.data.length).toBe(3);
            // Nested item removed
            expect(ds.data[0].children!.length).toBe(2);
            expect(ds.data[0].children!.map((c) => c.id)).toEqual(['eng-fe', 'eng-be']);
        });

        test('should remove multiple nested items', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            ds.addTransaction({
                remove: [{ id: 'eng-fe' } as TreeItem, { id: 'sales-na' } as TreeItem],
            });
            ds.commitPendingTransactions();

            expect(ds.data[0].children!.length).toBe(2);
            expect(ds.data[1].children!.length).toBe(1);
        });
    });

    describe('add with nested deduplication', () => {
        test('should not duplicate items already nested in the tree', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            // Simulate user manually adding to children, then calling applyTransaction
            const newLeaf = { id: 'eng-new', name: 'New Team', value: 10 };
            data[0].children!.push(newLeaf);
            ds.addTransaction({ add: [newLeaf] });
            ds.commitPendingTransactions();

            // Should NOT appear at root level (only in children)
            expect(ds.data.length).toBe(3);
            expect(ds.data[0].children!.length).toBe(4);
            expect(ds.data[0].children![3].id).toBe('eng-new');
        });

        test('should allow adding genuinely new root-level items', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            const newDept = { id: 'marketing', name: 'Marketing', children: [] };
            ds.addTransaction({ add: [newDept] });
            ds.commitPendingTransactions();

            expect(ds.data.length).toBe(4);
            expect(ds.data[3].id).toBe('marketing');
        });

        test('should handle add + manual nested push in same transaction', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            // Add two items: one genuinely new root, one already nested
            const nestedLeaf = { id: 'ops-it', name: 'IT', value: 6 };
            data[2].children!.push(nestedLeaf);

            const newRoot = { id: 'legal', name: 'Legal Dept', children: [] };

            ds.addTransaction({ add: [nestedLeaf, newRoot] });
            ds.commitPendingTransactions();

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
            const ds = new HierarchyDataSet<TreeItem>(data, 'id', 'children');

            ds.addTransaction({
                update: [{ id: 'eng-fe', name: 'Frontend', value: 100 }],
                remove: [{ id: 'eng-infra' } as TreeItem],
            });
            ds.commitPendingTransactions();

            expect(ds.data[0].children![0].value).toBe(100);
            expect(ds.data[0].children!.length).toBe(2);
            expect(ds.data[0].children!.map((c) => c.id)).toEqual(['eng-fe', 'eng-be']);
        });
    });

    describe('without dataIdKey', () => {
        test('should behave like base DataSet when no dataIdKey is set', () => {
            const data = createTestData();
            const ds = new HierarchyDataSet<TreeItem>(data, undefined, 'children');

            const newItem = { id: 'new', name: 'New', value: 1 };
            ds.addTransaction({ add: [newItem] });
            ds.commitPendingTransactions();

            // Without dataIdKey, deduplication doesn't apply
            expect(ds.data.length).toBe(4);
        });
    });
});
