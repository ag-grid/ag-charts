import { _ModuleSupport } from 'ag-charts-community';
import type { DynamicContext } from 'ag-charts-core';

import type { DataSetSelectionsIterator } from './dataSelectionUtil';
import { DataSetSelection } from './dataSetSelection';

const { SelectionState } = _ModuleSupport;

type ChartRegistry = _ModuleSupport.ChartRegistry;
type DataChangeDescription = _ModuleSupport.DataChangeDescription;
type DataSet<T> = _ModuleSupport.DataSet<T>;
type IDataSelectionService = _ModuleSupport.IDataSelectionService;
type SelectionStateEnum = _ModuleSupport.SelectionState;
type SeriesLike = Parameters<IDataSelectionService['getDataSelectionState']>[0];

/** Lazy-create a per-series selection backed by a Uint8Array of `data.length`. */
export function enableSelection(
    selections: Map<string, DataSetSelection>,
    seriesId: string,
    data: DataSet<unknown>
): DataSetSelection {
    let sel = selections.get(seriesId);
    if (!sel) {
        sel = new DataSetSelection(data.data.length);
        selections.set(seriesId, sel);
    }
    return sel;
}

/**
 * Transfer persistent state (selections) from a predecessor DataSet.
 * Uses `idArray` + `idToIndexMap` to map selected keys from old to new index space.
 * Without `dataIdKey`, selections cannot be transferred and are dropped.
 */
export function transferDataSet<T>(
    selections: Map<string, DataSetSelection>,
    newDataSet: DataSet<T>,
    oldDataSet: DataSet<T>
): void {
    if (selections.size === 0) return;

    const oldIds = oldDataSet.getIdArray();
    if (!oldIds) {
        if (oldDataSet.data.length === newDataSet.data.length) {
            // There's no dataId, but lengths are the same so assume the indices match to the same datums. This
            // assumption is not guaranteed, but is likely in most use cases. In the use cases where it isn't, it's
            // up the user to decide whether to call `chart.clearSelection()` or to integrate `dataIdKey`.
            //
            // Just copy the previous selection state:
            for (const [seriesId, oldSelObj] of selections) {
                selections.set(seriesId, oldSelObj);
            }
        }
        return;
    }

    if (!newDataSet.dataIdKey || newDataSet.dataIdKey !== oldDataSet.dataIdKey) {
        return;
    }

    const newIdMap = newDataSet.getIdToIndexMap();
    for (const [seriesId, oldSelObj] of selections) {
        const oldSel = oldSelObj.getSelection();
        // Collect selected keys (transient Set, O(k) where k = selected count)
        const selectedKeys = new Set<string | number>();
        for (let i = 0; i < oldSel.length; i++) {
            const id = oldIds[i];
            if (oldSel[i] && id != null) selectedKeys.add(id);
        }
        if (selectedKeys.size === 0) continue;

        // Map into new index space (O(k) lookups)
        const newSelObj = enableSelection(selections, seriesId, newDataSet);
        for (const key of selectedKeys) {
            const idx = newIdMap.get(key);
            if (idx != null) newSelObj.select(idx);
        }
        // selectedKeys GC'd after this scope
    }
}

export function applyDataChange(
    selections: Map<string, DataSetSelection>,
    changeDescription: DataChangeDescription
): void {
    if (selections.size > 0) {
        for (const sel of selections.values()) {
            sel.applyDataChange(changeDescription);
        }
    }
}

export class DataSelectionService implements IDataSelectionService {
    public totalSelectedCount = 0;

    /** Per-series selection state. Keyed by `seriesId`. */
    private readonly selections = new Map<string, DataSetSelection>();

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {}

    clear(): void {
        for (const [_, selection] of this.selections) {
            selection.clear();
        }
        this.totalSelectedCount = 0;
    }

    /** Lazy-create a per-series selection backed by a Uint8Array of `data.length`. */
    enableSelection(seriesId: string, data: DataSet<unknown>): DataSetSelection {
        return enableSelection(this.selections, seriesId, data);
    }

    *iterateDataSetSelections(): Generator<DataSetSelectionsIterator> {
        const it: DataSetSelectionsIterator = {} as any;

        for (const series of this.ctx.chartService.series) {
            const seriesId = series.id;
            const dataSet = series.data;
            const selection = this.selections.get(series.id);
            if (dataSet !== undefined && selection !== undefined) {
                it.seriesId = seriesId;
                it.dataSet = dataSet;
                it.selection = selection;
                yield it;
            }
        }
    }

    //------------------------------------------------------------------------------
    // IDataSelectionService implementation
    //------------------------------------------------------------------------------

    /**
     * Transfer persistent state (selections) from a predecessor DataSet.
     * Uses `idArray` + `idToIndexMap` to map selected keys from old to new index space.
     * Without `dataIdKey`, selections cannot be transferred and are dropped.
     */
    transferDataSet<T>(newDataSet: DataSet<T>, oldDataSet: DataSet<T>): void {
        return transferDataSet(this.selections, newDataSet, oldDataSet);
    }

    applyDataChange(changeDescription: DataChangeDescription): void {
        return applyDataChange(this.selections, changeDescription);
    }

    getDataSetSelection(series: SeriesLike): DataSetSelection | undefined {
        return this.selections?.get(series.id);
    }

    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionStateEnum | undefined {
        if (!series.properties.selection.enabled) return undefined;

        const options = this.ctx.chartState.getValue('options');
        if (!options?.selection?.enabled) return undefined;

        if (this.totalSelectedCount === 0) {
            return SelectionState.None;
        }

        // When aggregation is active, a rendered marker stands in for an
        // entire bucket. The bucket is considered selected if any of its
        // underlying datums is selected, regardless of which one happens to
        // be the bucket's representative index. Fall back to the per-datum
        // bitset when no aggregation level applies.
        const selectionBuffer = this.getDataSetSelection(series);
        if (typeof datumIndex === 'number') {
            const aggregated = series.ensureBucketLookupFeature()?.isBucketSelected(datumIndex);
            const isItem = aggregated ?? selectionBuffer?.isSelected(datumIndex) ?? false;
            if (isItem) {
                return SelectionState.Item;
            } else {
                return SelectionState.OtherItem;
            }
        }
        return SelectionState.OtherSeries;
    }
}
