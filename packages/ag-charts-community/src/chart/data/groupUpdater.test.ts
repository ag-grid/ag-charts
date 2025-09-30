import { DataChangeDescriptorBuilder } from './dataChangeDescriptor';
import type { DataGroup } from './dataModel';
import { GroupUpdater } from './groupUpdater';

const scopeId = 'scope1';
const scopes = new Set([scopeId]);
const columnScopes = [new Set([scopeId])];

function createGroup(keys: any[], indices: number[]): DataGroup {
    return {
        keys,
        datumIndices: [indices.slice()],
        aggregation: [],
        validScopes: new Set(scopes),
    };
}

function deriveOriginalLength(groups: DataGroup[]): number {
    let maxIndex = -1;
    for (const group of groups) {
        for (const indices of group.datumIndices) {
            if (!indices) continue;
            for (const index of indices) {
                if (index > maxIndex) {
                    maxIndex = index;
                }
            }
        }
    }
    return maxIndex + 1;
}

function defaultOptions(originalLength: number) {
    return {
        keyExtractor: (datum: any) => [datum.category],
        columnCount: 1,
        columnScopes,
        scopeId,
        scopes,
        originalLength,
    } as const;
}

describe('GroupUpdater', () => {
    it('keeps groups untouched when there are no changes', () => {
        const groups = [createGroup(['A'], [0, 1])];
        const changes = DataChangeDescriptorBuilder.create().build();

        GroupUpdater.updateGroups(groups, changes, defaultOptions(deriveOriginalLength(groups)));

        expect(groups).toHaveLength(1);
        expect(groups[0].datumIndices[0]).toEqual([0, 1]);
        expect(groups[0].validScopes.size).toBe(scopes.size);
    });

    it('removes deleted indices and shifts remaining ones', () => {
        const groups = [createGroup(['A'], [0, 1, 2]), createGroup(['B'], [3, 4])];
        const changes = DataChangeDescriptorBuilder.create()
            .addRemoval(1, { category: 'A' })
            .addRemoval(3, { category: 'B' })
            .build();

        GroupUpdater.updateGroups(groups, changes, defaultOptions(deriveOriginalLength(groups)));

        expect(groups[0].datumIndices[0]).toEqual([0, 1]);
        expect(groups[1].datumIndices[0]).toEqual([2]);
        expect(groups[0].validScopes.size).toBe(0);
        expect(groups[1].validScopes.size).toBe(0);
    });

    it('moves updated datum to matching group when keys change', () => {
        const groups = [createGroup(['A'], [0, 1]), createGroup(['B'], [2])];
        const changes = DataChangeDescriptorBuilder.create().addUpdate(1, { category: 'A' }, { category: 'B' }).build();

        // Add groupingFn to enable merging behavior (multi-scope or custom grouping merges by key)
        GroupUpdater.updateGroups(groups, changes, {
            ...defaultOptions(deriveOriginalLength(groups)),
            groupingFn: (keys: any[]) => keys, // Identity function to enable merging
        });

        expect(groups.find((g) => g.keys[0] === 'A')?.datumIndices[0]).toEqual([0]);
        expect(groups.find((g) => g.keys[0] === 'B')?.datumIndices[0]).toEqual([1, 2]);
    });

    it('adds inserted data to existing and new groups', () => {
        const groups = [createGroup(['A'], [0, 1])];
        const changes = DataChangeDescriptorBuilder.create()
            .addInsertion(2, { category: 'A' })
            .addInsertion(3, { category: 'B' })
            .build();

        // Add groupingFn to enable merging behavior (multi-scope or custom grouping merges by key)
        GroupUpdater.updateGroups(groups, changes, {
            ...defaultOptions(deriveOriginalLength(groups)),
            groupingFn: (keys: any[]) => keys, // Identity function to enable merging
        });

        const groupA = groups.find((g) => g.keys[0] === 'A');
        const groupB = groups.find((g) => g.keys[0] === 'B');

        expect(groupA?.datumIndices[0]).toEqual([0, 1, 2]);
        expect(groupB?.datumIndices[0]).toEqual([3]);
    });

    it('removes empty groups', () => {
        const groups = [createGroup(['A'], [0]), createGroup(['B'], [1])];
        const changes = DataChangeDescriptorBuilder.create().addRemoval(1, { category: 'B' }).build();

        GroupUpdater.updateGroups(groups, changes, defaultOptions(deriveOriginalLength(groups)));

        expect(groups).toHaveLength(1);
        expect(groups[0].keys).toEqual(['A']);
    });
});
