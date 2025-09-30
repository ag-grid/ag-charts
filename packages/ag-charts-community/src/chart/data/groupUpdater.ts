import type { DataChangeDescriptor } from './dataChangeDescriptor';
import type { DataGroup } from './dataModel';

export interface GroupUpdateOptions {
    keyExtractor: (datum: any, index: number) => any[] | undefined;
    columnCount: number;
    columnScopes: Set<string>[];
    scopeId: string;
    scopes: Set<string>;
    originalLength: number;
    groupingFn?: (keys: any[]) => any[];
}

type ColumnMask = boolean[];

type IndexMapping = {
    oldToNew: Map<number, number>;
    insertions: Array<{ datum: any; newIndex: number }>;
};

export class GroupUpdater {
    static updateGroups(groups: DataGroup[], changes: DataChangeDescriptor, options: GroupUpdateOptions): void {
        if (
            changes.metadata.totalRemoved === 0 &&
            changes.metadata.totalInserted === 0 &&
            changes.metadata.totalUpdated === 0
        ) {
            return;
        }

        const columnMask = GroupUpdater.createColumnMask(options.columnCount, options.columnScopes, options.scopeId);
        const groupsByKey = new Map<string, DataGroup>();
        for (const group of groups) {
            groupsByKey.set(GroupUpdater.keyId(group.keys), group);
        }

        const { oldToNew, insertions } = GroupUpdater.buildIndexMapping(options.originalLength, changes);
        const { indexToGroup, dirtyGroups } = GroupUpdater.mapExistingIndices(groups, oldToNew, columnMask);

        GroupUpdater.relocateUpdatedEntries({
            changes,
            options,
            oldToNew,
            columnMask,
            groups,
            groupsByKey,
            indexToGroup,
            dirtyGroups,
        });

        GroupUpdater.addInsertedEntries({
            insertions,
            options,
            columnMask,
            groups,
            groupsByKey,
            indexToGroup,
            dirtyGroups,
        });

        GroupUpdater.removeEmptyGroups(groups, groupsByKey, columnMask, dirtyGroups);
        GroupUpdater.invalidateScopes(dirtyGroups);
    }

    private static relocateUpdatedEntries(args: {
        changes: DataChangeDescriptor;
        options: GroupUpdateOptions;
        oldToNew: Map<number, number>;
        columnMask: ColumnMask;
        groups: DataGroup[];
        groupsByKey: Map<string, DataGroup>;
        indexToGroup: Map<number, DataGroup>;
        dirtyGroups: Set<DataGroup>;
    }): void {
        for (const update of args.changes.updated) {
            const newIndex = args.oldToNew.get(update.index);
            if (newIndex == null) {
                continue;
            }

            const oldKeys = args.options.keyExtractor(update.oldDatum, update.index) ?? [];
            const newKeys = args.options.keyExtractor(update.newDatum, newIndex) ?? [];

            if (GroupUpdater.keysEqual(oldKeys, newKeys)) {
                continue;
            }

            const existingGroup = args.indexToGroup.get(newIndex);
            if (existingGroup && GroupUpdater.removeIndexFromGroup(existingGroup, newIndex, args.columnMask)) {
                args.dirtyGroups.add(existingGroup);
            }

            const targetGroup = GroupUpdater.getOrCreateGroup(
                args.groups,
                args.groupsByKey,
                newKeys,
                args.options,
                args.columnMask
            );

            GroupUpdater.addIndexToGroup(targetGroup, newIndex, args.columnMask);
            args.dirtyGroups.add(targetGroup);
            args.indexToGroup.set(newIndex, targetGroup);
        }
    }

    private static addInsertedEntries(args: {
        insertions: Array<{ datum: any; newIndex: number }>;
        options: GroupUpdateOptions;
        columnMask: ColumnMask;
        groups: DataGroup[];
        groupsByKey: Map<string, DataGroup>;
        indexToGroup: Map<number, DataGroup>;
        dirtyGroups: Set<DataGroup>;
    }): void {
        for (const insertion of args.insertions) {
            const keys = args.options.keyExtractor(insertion.datum, insertion.newIndex) ?? [];
            const targetGroup = GroupUpdater.getOrCreateGroup(
                args.groups,
                args.groupsByKey,
                keys,
                args.options,
                args.columnMask
            );

            GroupUpdater.addIndexToGroup(targetGroup, insertion.newIndex, args.columnMask);
            args.dirtyGroups.add(targetGroup);
            args.indexToGroup.set(insertion.newIndex, targetGroup);
        }
    }

    private static createColumnMask(columnCount: number, columnScopes: Set<string>[], scopeId: string): ColumnMask {
        const mask: boolean[] = [];
        for (let columnIdx = 0; columnIdx < columnCount; columnIdx++) {
            const scopes = columnScopes[columnIdx];
            mask[columnIdx] = scopes ? scopes.has(scopeId) : false;
        }
        return mask;
    }

    private static buildIndexMapping(originalLength: number, changes: DataChangeDescriptor): IndexMapping {
        const working: number[] = Array.from({ length: Math.max(originalLength, 0) }, (_, index) => index);
        const placeholderMeta = new Map<number, { datum: any }>();

        const removals = [...changes.removed].sort((a, b) => b.index - a.index);
        for (const removal of removals) {
            if (removal.index >= 0 && removal.index < working.length) {
                working.splice(removal.index, 1);
            }
        }

        const insertions = [...changes.inserted].sort((a, b) => a.index - b.index);
        let placeholderId = 0;
        for (const insertion of insertions) {
            const placeholder = -++placeholderId;
            placeholderMeta.set(placeholder, { datum: insertion.datum });

            const targetIndex = Math.min(Math.max(insertion.index, 0), working.length);
            working.splice(targetIndex, 0, placeholder);
        }

        const oldToNew = new Map<number, number>();
        const insertionPositions: Array<{ datum: any; newIndex: number }> = [];

        for (let newIndex = 0; newIndex < working.length; newIndex++) {
            const token = working[newIndex];
            if (token >= 0) {
                oldToNew.set(token, newIndex);
                continue;
            }

            const meta = placeholderMeta.get(token);
            if (meta) {
                insertionPositions.push({ datum: meta.datum, newIndex });
            }
        }

        return { oldToNew, insertions: insertionPositions };
    }

    private static mapExistingIndices(
        groups: DataGroup[],
        oldToNew: Map<number, number>,
        columnMask: ColumnMask
    ): { indexToGroup: Map<number, DataGroup>; dirtyGroups: Set<DataGroup> } {
        const indexToGroup = new Map<number, DataGroup>();
        const dirtyGroups = new Set<DataGroup>();

        for (const group of groups) {
            for (let columnIdx = 0; columnIdx < columnMask.length; columnIdx++) {
                if (!columnMask[columnIdx]) {
                    continue;
                }

                const source = group.datumIndices[columnIdx] ?? [];
                const updated: number[] = [];

                for (const oldIndex of source) {
                    const mapped = oldToNew.get(oldIndex);
                    if (mapped != null) {
                        updated.push(mapped);
                    }
                }

                if (updated.length !== source.length) {
                    dirtyGroups.add(group);
                }

                updated.sort((a, b) => a - b);

                const target = group.datumIndices[columnIdx] ?? (group.datumIndices[columnIdx] = []);
                target.length = 0;
                target.push(...updated);

                for (const index of updated) {
                    indexToGroup.set(index, group);
                }
            }
        }

        return { indexToGroup, dirtyGroups };
    }

    private static getOrCreateGroup(
        groups: DataGroup[],
        groupsByKey: Map<string, DataGroup>,
        keys: any[],
        options: GroupUpdateOptions,
        columnMask: ColumnMask
    ): DataGroup {
        // Match the full reprocessing behavior from dataModel.ts groupData():
        // Only merge items by key when we have multi-scope data or a custom grouping function.
        // For single-scope data without custom grouping, each datum gets its own group.
        const shouldMergeByKey = options.scopes.size !== 1 || options.groupingFn != null;

        if (shouldMergeByKey) {
            const key = GroupUpdater.keyId(keys);
            const existing = groupsByKey.get(key);
            if (existing) {
                return existing;
            }
        }

        // Create new group (always for single-scope, or when key doesn't exist for multi-scope)
        const group: DataGroup = {
            keys: [...keys],
            datumIndices: [],
            aggregation: [],
            validScopes: new Set(options.scopes),
        };

        // Ensure datum indices arrays exist for relevant columns so future lookups stay predictable.
        for (let columnIdx = 0; columnIdx < columnMask.length; columnIdx++) {
            if (columnMask[columnIdx]) {
                group.datumIndices[columnIdx] = [];
            }
        }

        groups.push(group);

        // Only register in groupsByKey if we're using it for merging
        if (shouldMergeByKey) {
            groupsByKey.set(GroupUpdater.keyId(keys), group);
        }

        return group;
    }

    private static addIndexToGroup(group: DataGroup, index: number, columnMask: ColumnMask): void {
        for (let columnIdx = 0; columnIdx < columnMask.length; columnIdx++) {
            if (!columnMask[columnIdx]) {
                continue;
            }

            const indices = group.datumIndices[columnIdx] ?? (group.datumIndices[columnIdx] = []);
            GroupUpdater.insertSorted(indices, index);
        }
    }

    private static removeIndexFromGroup(group: DataGroup, index: number, columnMask: ColumnMask): boolean {
        let removed = false;

        for (let columnIdx = 0; columnIdx < columnMask.length; columnIdx++) {
            if (!columnMask[columnIdx]) {
                continue;
            }

            const indices = group.datumIndices[columnIdx];
            if (!indices) {
                continue;
            }

            const position = indices.indexOf(index);
            if (position >= 0) {
                indices.splice(position, 1);
                removed = true;
            }
        }

        return removed;
    }

    private static removeEmptyGroups(
        groups: DataGroup[],
        groupsByKey: Map<string, DataGroup>,
        columnMask: ColumnMask,
        dirtyGroups: Set<DataGroup>
    ): void {
        for (let index = groups.length - 1; index >= 0; index--) {
            const group = groups[index];
            if (!GroupUpdater.isGroupEmpty(group, columnMask)) {
                continue;
            }

            groups.splice(index, 1);
            groupsByKey.delete(GroupUpdater.keyId(group.keys));
            dirtyGroups.delete(group);
        }
    }

    private static invalidateScopes(groups: Set<DataGroup>): void {
        for (const group of groups) {
            group.validScopes.clear();
        }
    }

    private static isGroupEmpty(group: DataGroup, columnMask: ColumnMask): boolean {
        for (let columnIdx = 0; columnIdx < columnMask.length; columnIdx++) {
            if (!columnMask[columnIdx]) {
                continue;
            }

            const indices = group.datumIndices[columnIdx];
            if (indices && indices.length > 0) {
                return false;
            }
        }

        return true;
    }

    private static keysEqual(first: any[], second: any[]): boolean {
        if (first.length !== second.length) {
            return false;
        }

        for (let index = 0; index < first.length; index++) {
            const a = first[index];
            const b = second[index];
            if (a === b) {
                continue;
            }

            if (!GroupUpdater.valuesEqual(a, b)) {
                return false;
            }
        }

        return true;
    }

    private static valuesEqual(a: unknown, b: unknown): boolean {
        if (a === b) {
            return true;
        }

        if (a != null && b != null && typeof a === 'object' && typeof b === 'object') {
            try {
                return JSON.stringify(a) === JSON.stringify(b);
            } catch {
                // Fallback to reference equality when serialization fails.
                return a === b;
            }
        }

        return false;
    }

    private static keyId(keys: any[]): string {
        return keys
            .map((key) => {
                if (key != null && typeof key === 'object') {
                    try {
                        return JSON.stringify(key);
                    } catch {
                        return String(key);
                    }
                }
                return String(key);
            })
            .join('|');
    }

    private static insertSorted(array: number[], value: number): void {
        let left = 0;
        let right = array.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            const current = array[mid];

            if (current === value) {
                return;
            }

            if (current < value) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        array.splice(left, 0, value);
    }
}
