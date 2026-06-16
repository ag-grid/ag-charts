import { _ModuleSupport } from 'ag-charts-community';
import { Logger, reversePush } from 'ag-charts-core';

type TransactionCollectionState<T> = _ModuleSupport.TransactionCollectionState<T>;
type DataChangeDescriptionListener = _ModuleSupport.DataChangeDescriptionListener;

const { DataSet } = _ModuleSupport;

type DFSMemory<T> = {
    groupLookup: number[];
    datumLookup: T[];
};

function pushChildren<T>(stack: T[], node: T, childrenKey: string): void {
    if (typeof node === 'object' && node != null) {
        const lenientNode: { [K in string]?: unknown } = node;
        const children: unknown = lenientNode[childrenKey];
        if (children instanceof Array) {
            // push to stack in reverse, so that the first child is visited first:
            reversePush(stack, children);
        }
    }
}

/**
 * DataSet subclass that understands hierarchical/nested data (e.g. treemap with `childrenKey`).
 * Extends ID-based transaction logic to find, update, and remove items nested within children arrays.
 */
export class HierarchyDataSet<T = unknown> extends DataSet<T> {
    private dfsOrdering?: DFSMemory<T> | undefined;

    constructor(
        data: T[],
        dataIdKey: string | undefined,
        private readonly childrenKey: string
    ) {
        super(data, dataIdKey);
    }

    private getDfsOrdering(): DFSMemory<T> {
        if (this.dfsOrdering !== undefined) return this.dfsOrdering;
        this.dfsOrdering = { groupLookup: [], datumLookup: [] };

        const stack: T[] = [];
        for (let groupNumber = 0; groupNumber < this.data.length; groupNumber++) {
            let node: T | undefined = this.data[groupNumber];
            while (node !== undefined) {
                this.dfsOrdering.datumLookup.push(node);
                this.dfsOrdering.groupLookup.push(groupNumber);
                pushChildren(stack, node, this.childrenKey);
                node = stack.pop();
            }
        }
        return this.dfsOrdering;
    }

    private getGroupNumber(id: string | number): number | undefined {
        const idx = this.getIdToIndexMap().get(id);
        if (idx !== undefined) {
            return this.getDfsOrdering().groupLookup[idx];
        }
        return undefined;
    }

    override size(): number {
        return this.getDfsOrdering().datumLookup.length;
    }

    override getDatumAt(datumIndex: number): T | undefined {
        return this.getDfsOrdering().datumLookup[datumIndex];
    }

    /**
     * After the base commit, remove any root-level items whose IDs already exist
     * nested in the tree. This handles the case where the user manually adds an item
     * to a parent's children array and also calls applyTransaction({ add: [item] }),
     * which would otherwise duplicate the item at root level.
     */
    override commitPendingTransactions(changeDescriptionListener: DataChangeDescriptionListener | undefined): boolean {
        const result = super.commitPendingTransactions(changeDescriptionListener);
        if (result && this.dataIdKey) {
            this.removeNestedDuplicatesFromRoot();
            // Invalidate after structural changes — splice may shift root indices.
            this.idToIndexCache = undefined;
            this.idArrayCache = undefined;
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

    /** Recursively indexes all items (root and nested) by ID, mapping each to its DFS order. */
    public override getIdToIndexMap(): Map<string | number, number> {
        if (this.idToIndexCache === undefined) {
            this.idToIndexCache = new Map();
            const dfsOrdering = this.getDfsOrdering().datumLookup;
            let dataIdKeyFoundCount = 0;
            for (let datumIndex = 0; datumIndex < dfsOrdering.length; datumIndex++) {
                const itemId: string | number = this.getIdValue(dfsOrdering[datumIndex]) ?? datumIndex;
                this.idToIndexCache.set(itemId, datumIndex);
                if (typeof itemId === 'string') {
                    dataIdKeyFoundCount++;
                }
            }
            if (this.dataIdKey !== undefined && dataIdKeyFoundCount === 0 && this.data.length > 0) {
                Logger.warnOnce(`dataIdKey '${this.dataIdKey}' was not found on any data item.`);
            }
        }
        return this.idToIndexCache;
    }

    /** Handles updates for both root-level and nested items. */
    protected override collectUpdatedOriginalIndicesById(
        toUpdate: Map<string | number, T>,
        state: TransactionCollectionState<T>
    ): void {
        for (const [id, newDatum] of toUpdate) {
            const idx: number | undefined = this.getGroupNumber(id);
            if (idx !== undefined && !state.removedOriginalIndices.has(idx)) {
                const rootItem = this.data[idx];
                const rootId = this.getIdValue(rootItem);

                if (rootId === id) {
                    // Root-level item: standard replacement via pendingReplacements
                    state.updatedOriginalIndices.add(idx);
                    state.pendingReplacements ??= new Map();
                    state.pendingReplacements.set(id, newDatum);
                } else if (this.replaceNestedItem(rootItem, id, newDatum)) {
                    // Nested item: walk tree and replace in-place
                    state.updatedOriginalIndices.add(idx);
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

        if (state.trackedInsertions.length > 0) {
            this.removeFromTrackedInsertionsById(remove, state);
        }

        if (idsToRemove.size > 0) {
            this.removeFromGroupsByIdForHierarchy(state.appendsList, idsToRemove);
        }

        // Then try removing from original data (root-level or nested)
        if (idsToRemove.size > 0) {
            for (const id of idsToRemove) {
                const idx = this.getGroupNumber(id);
                if (idx !== undefined) {
                    const rootItem = this.data[idx];
                    const rootId = this.getIdValue(rootItem);

                    if (rootId === id) {
                        // Root-level: mark for removal
                        state.removedOriginalIndices.add(idx);
                        state.virtualLength--;
                    } else if (this.removeNestedItem(rootItem, id)) {
                        // Nested: walk tree and splice in-place, mark root as updated
                        state.updatedOriginalIndices.add(idx);
                    }
                    idsToRemove.delete(id);
                }
            }
        }

        // No warning for hierarchy datasets: items may have been manually removed from
        // nested children arrays before the transaction commits (expected usage pattern).
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
