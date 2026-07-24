import { _ModuleSupport } from 'ag-charts-community';
import { Logger, reversePush } from 'ag-charts-core';

type TransactionCollectionState<T> = _ModuleSupport.TransactionCollectionState<T>;
type DataChangeDescriptionListener = _ModuleSupport.DataChangeDescriptionListener;
type DataChangeDescription = _ModuleSupport.DataChangeDescription;

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
    private dfsOrdering?: DFSMemory<T>;

    constructor(
        data: T[],
        dataIdKey: string | undefined,
        private readonly childrenKey: string,
        logger?: Logger
    ) {
        super(data, dataIdKey, logger);
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

    public isLeaf(datumIndex: number): boolean {
        const node: T | undefined = this.getDatumAt(datumIndex);
        if (node && typeof node === 'object') {
            const lenientNode: { [K in string]?: { length?: unknown } } = node;
            const children = lenientNode[this.childrenKey];
            return children === undefined || children.length === 0;
        }
        return false;
    }

    override size(): number {
        return this.getDfsOrdering().datumLookup.length;
    }

    override getDatumAt(datumIndex: number): T | undefined {
        return this.getDfsOrdering().datumLookup[datumIndex];
    }

    /**
     * Commits the transaction, then bridges the result to the selection listener in the DFS
     * index space it expects.
     *
     * The base change description is built in root (`this.data`) space, but selection bitsets are
     * sized to the DFS-expanded `size()`. Replaying the root-space description against a bitset
     * overruns it (the documented `RangeError`). So we suppress the base's listener call, let the
     * base mutate `this.data` correctly, then rebuild a DFS-space description by diffing the DFS
     * ordering before and after the commit and hand that to the listener instead.
     *
     * Also removes any root-level items whose IDs already exist nested in the tree — the case
     * where the user manually adds an item to a parent's children array and also calls
     * `applyTransaction({ add: [item] })`, which would otherwise duplicate it at root level.
     */
    override commitPendingTransactions(changeDescriptionListener: DataChangeDescriptionListener | undefined): boolean {
        // Snapshot the DFS ordering before the commit mutates the tree; the bitset is indexed in it.
        const oldDfsDatums = changeDescriptionListener ? [...this.getDfsOrdering().datumLookup] : undefined;

        const committed = super.commitPendingTransactions(undefined);
        if (!committed) return false;

        if (this.dataIdKey) {
            this.removeNestedDuplicatesFromRoot();
        }

        // The tree changed; rebuild DFS ordering and id caches on next access.
        this.dfsOrdering = undefined;
        this.idToIndexCache = undefined;
        this.idArrayCache = undefined;

        if (oldDfsDatums !== undefined) {
            changeDescriptionListener!.onDataChange(this.buildDfsChangeDescription(oldDfsDatums));
        }
        return true;
    }

    /**
     * Builds a change description in DFS index space by matching each pre-commit DFS datum to its
     * post-commit DFS position by identity (id, or object reference when no `dataIdKey`). Survivors
     * keep their selection at the new position; removed nodes drop out; new nodes default to 0.
     */
    private buildDfsChangeDescription(oldDfsDatums: T[]): DataChangeDescription {
        const finalLength = this.size();
        const newById = this.dataIdKey == null ? undefined : this.getIdToIndexMap();
        const newByRef = this.buildDfsRefIndex();

        const removedIndices = new Set<number>();
        const survivorNewIndices: number[] = [];
        for (let oldIndex = 0; oldIndex < oldDfsDatums.length; oldIndex++) {
            const datum = oldDfsDatums[oldIndex];
            const id = this.getIdValue(datum);
            const newIndex = id == null ? newByRef.get(datum) : newById?.get(id);
            if (newIndex === undefined) {
                removedIndices.add(oldIndex);
            } else {
                survivorNewIndices.push(newIndex);
            }
        }

        // applyToTypedArray's block copy assumes survivors keep their relative order. Duplicate
        // dataIdKey values (warned about elsewhere) can break that; if so, drop selections rather
        // than risk an out-of-bounds copy.
        for (let k = 1; k < survivorNewIndices.length; k++) {
            if (survivorNewIndices[k] <= survivorNewIndices[k - 1]) {
                survivorNewIndices.length = 0;
                removedIndices.clear();
                for (let i = 0; i < oldDfsDatums.length; i++) removedIndices.add(i);
                break;
            }
        }

        const indexMap = this.buildDfsIndexMap(oldDfsDatums.length, finalLength, removedIndices, survivorNewIndices);
        const insertions = { prependValues: [], appendValues: [], insertionValues: [] };
        return new _ModuleSupport.DataChangeDescription(indexMap, insertions);
    }

    /** Maps each DFS datum (by object reference) to its DFS index. */
    private buildDfsRefIndex(): Map<T, number> {
        const lookup = this.getDfsOrdering().datumLookup;
        const map = new Map<T, number>();
        for (let i = 0; i < lookup.length; i++) {
            if (!map.has(lookup[i])) map.set(lookup[i], i);
        }
        return map;
    }

    /**
     * Expresses the old→new DFS transformation as prepend/mid-insert/append splice operations plus
     * removed source indices — the shape `DataChangeDescription.applyToTypedArray` consumes.
     */
    private buildDfsIndexMap(
        originalLength: number,
        finalLength: number,
        removedIndices: Set<number>,
        survivorNewIndices: number[]
    ) {
        const hasSurvivors = survivorNewIndices.length > 0;
        const totalPrependCount = hasSurvivors ? survivorNewIndices[0] : 0;
        const lastSurvivor = survivorNewIndices.at(-1) ?? -1;
        const totalAppendCount = hasSurvivors ? finalLength - 1 - lastSurvivor : finalLength;

        const spliceOps: Array<{ index: number; deleteCount: number; insertCount: number }> = [];
        if (totalPrependCount > 0) {
            spliceOps.push({ index: 0, deleteCount: 0, insertCount: totalPrependCount });
        }
        for (let k = 0; k + 1 < survivorNewIndices.length; k++) {
            const gap = survivorNewIndices[k + 1] - survivorNewIndices[k] - 1;
            if (gap > 0) {
                spliceOps.push({ index: survivorNewIndices[k] + 1, deleteCount: 0, insertCount: gap });
            }
        }
        if (totalAppendCount > 0) {
            spliceOps.push({ index: finalLength - totalAppendCount, deleteCount: 0, insertCount: totalAppendCount });
        }

        return {
            originalLength,
            finalLength,
            spliceOps,
            removedIndices,
            updatedIndices: new Set<number>(),
            totalPrependCount,
            totalAppendCount,
        };
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
                const idValue: string | number | undefined = this.getIdValue(dfsOrdering[datumIndex]);
                const itemId: string | number = idValue ?? datumIndex;
                this.idToIndexCache.set(itemId, datumIndex);
                if (idValue !== undefined) {
                    dataIdKeyFoundCount++;
                }
            }
            if (this.dataIdKey !== undefined && dataIdKeyFoundCount === 0 && this.data.length > 0) {
                this.logger.warnOnce(`dataIdKey '${this.dataIdKey}' was not found on any data item.`);
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
                this.logger.warnOnce(`applyTransaction() remove item is missing '${this.dataIdKey}' field; ignoring.`);
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
