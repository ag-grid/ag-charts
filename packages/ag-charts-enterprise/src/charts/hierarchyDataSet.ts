import { Logger } from 'ag-charts-core';
import { _ModuleSupport } from 'ag-charts-community';

type TransactionCollectionState<T> = _ModuleSupport.TransactionCollectionState<T>;

const { DataSet } = _ModuleSupport;

/**
 * DataSet subclass that understands hierarchical/nested data (e.g. treemap with `childrenKey`).
 * Extends ID-based transaction logic to find, update, and remove items nested within children arrays.
 */
export class HierarchyDataSet<T = unknown> extends DataSet<T> {
    constructor(
        data: T[],
        dataIdKey: string | undefined,
        private readonly childrenKey: string
    ) {
        super(data, dataIdKey);
    }

    /**
     * After the base commit, remove any root-level items whose IDs already exist
     * nested in the tree. This handles the case where the user manually adds an item
     * to a parent's children array and also calls applyTransaction({ add: [item] }),
     * which would otherwise duplicate the item at root level.
     */
    override commitPendingTransactions(): boolean {
        const result = super.commitPendingTransactions();
        if (result && this.dataIdKey) {
            this.removeNestedDuplicatesFromRoot();
        }
        return result;
    }

    private removeNestedDuplicatesFromRoot(): void {
        const nestedIds = new Set<string | number>();
        for (const item of this.data) {
            this.collectNestedIds(item, nestedIds);
        }
        if (nestedIds.size === 0) return;

        let i = 0;
        while (i < this.data.length) {
            const id = this.getIdValue(this.data[i]);
            if (id !== undefined && nestedIds.has(id)) {
                this.data.splice(i, 1);
            } else {
                i++;
            }
        }
    }

    private collectNestedIds(item: T, ids: Set<string | number>): void {
        const children = (item as any)?.[this.childrenKey];
        if (!Array.isArray(children)) return;
        for (const child of children) {
            const id = this.getIdValue(child as T);
            if (id !== undefined) ids.add(id);
            this.collectNestedIds(child as T, ids);
        }
    }

    /** Recursively indexes all items (root and nested) by ID, mapping each to the root ancestor's index. */
    protected override getIdToIndexMap(): Map<string | number, number> {
        if (this.idToIndexCache === undefined) {
            this.idToIndexCache = new Map();
            for (let i = 0; i < this.data.length; i++) {
                this.indexItemRecursively(this.data[i], i);
            }
        }
        return this.idToIndexCache;
    }

    private indexItemRecursively(item: T, rootIndex: number): void {
        const id = this.getIdValue(item);
        if (id !== undefined) {
            if (!this.idToIndexCache!.has(id)) {
                this.idToIndexCache!.set(id, rootIndex);
            }
        }
        const children = (item as any)?.[this.childrenKey];
        if (Array.isArray(children)) {
            for (const child of children) {
                this.indexItemRecursively(child as T, rootIndex);
            }
        }
    }

    /** Handles updates for both root-level and nested items. */
    protected override collectUpdatedOriginalIndicesById(
        toUpdate: Map<string | number, T>,
        state: TransactionCollectionState<T>
    ): void {
        const idMap = this.getIdToIndexMap();

        for (const [id, newDatum] of toUpdate) {
            const idx = idMap.get(id);
            if (idx !== undefined && !state.removedOriginalIndices.has(idx)) {
                const rootItem = this.data[idx];
                const rootId = this.getIdValue(rootItem);

                if (rootId === id) {
                    // Root-level item: standard replacement via pendingReplacements
                    state.updatedOriginalIndices.add(idx);
                    state.pendingReplacements ??= new Map();
                    state.pendingReplacements.set(id, newDatum);
                } else {
                    // Nested item: walk tree and replace in-place
                    if (this.replaceNestedItem(rootItem, id, newDatum)) {
                        state.updatedOriginalIndices.add(idx);
                    }
                }
                toUpdate.delete(id);
            }
        }
    }

    /** Handles removals for both root-level and nested items. */
    protected override applyRemovalsById(remove: T[], state: TransactionCollectionState<T>): void {
        const idsToRemove = new Set<string | number>();
        for (const item of remove) {
            const id = this.getIdValue(item);
            if (id === undefined) {
                Logger.warnOnce(`applyTransaction() remove item is missing '${this.dataIdKey}' field; ignoring.`);
            } else {
                idsToRemove.add(id);
            }
        }

        if (idsToRemove.size === 0) return;

        // First try removing from prepends/insertions/appends (same as base class)
        this.removeFromGroupsByIdForHierarchy(state.prependsList, idsToRemove);

        if (idsToRemove.size > 0) {
            this.removeFromGroupsByIdForHierarchy(state.insertionsList, idsToRemove);
        }

        if (idsToRemove.size > 0) {
            this.removeFromGroupsByIdForHierarchy(state.appendsList, idsToRemove);
        }

        // Then try removing from original data (root-level or nested)
        if (idsToRemove.size > 0) {
            const idMap = this.getIdToIndexMap();
            for (const id of idsToRemove) {
                const idx = idMap.get(id);
                if (idx !== undefined) {
                    const rootItem = this.data[idx];
                    const rootId = this.getIdValue(rootItem);

                    if (rootId === id) {
                        // Root-level: mark for removal
                        state.removedOriginalIndices.add(idx);
                        state.virtualLength--;
                    } else {
                        // Nested: walk tree and splice in-place, mark root as updated
                        if (this.removeNestedItem(rootItem, id)) {
                            state.updatedOriginalIndices.add(idx);
                        }
                    }
                    idsToRemove.delete(id);
                }
            }
        }

        if (idsToRemove.size > 0) {
            Logger.warnOnce(
                'applyTransaction() remove includes items not present in current data; ignoring missing items.'
            );
        }
    }

    /** Walks the tree to find and replace a nested item by ID. Returns true if found. */
    private replaceNestedItem(parent: T, targetId: string | number, newDatum: T): boolean {
        const children = (parent as any)?.[this.childrenKey];
        if (!Array.isArray(children)) return false;

        for (let i = 0; i < children.length; i++) {
            const childId = this.getIdValue(children[i] as T);
            if (childId === targetId) {
                children[i] = newDatum;
                return true;
            }
            if (this.replaceNestedItem(children[i] as T, targetId, newDatum)) {
                return true;
            }
        }
        return false;
    }

    /** Walks the tree to find and splice a nested item by ID. Returns true if found. */
    private removeNestedItem(parent: T, targetId: string | number): boolean {
        const children = (parent as any)?.[this.childrenKey];
        if (!Array.isArray(children)) return false;

        for (let i = 0; i < children.length; i++) {
            const childId = this.getIdValue(children[i] as T);
            if (childId === targetId) {
                children.splice(i, 1);
                return true;
            }
            if (this.removeNestedItem(children[i] as T, targetId)) {
                return true;
            }
        }
        return false;
    }

    /** Removes items from groups by matching their ID values. */
    private removeFromGroupsByIdForHierarchy(groups: T[][], idsToRemove: Set<string | number>): void {
        for (const group of groups) {
            let i = 0;
            while (i < group.length && idsToRemove.size > 0) {
                const id = this.getIdValue(group[i]);
                if (id !== undefined && idsToRemove.has(id)) {
                    idsToRemove.delete(id);
                    group.splice(i, 1);
                } else {
                    i++;
                }
            }
            if (idsToRemove.size === 0) break;
        }
    }
}
