import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, Bitfield, type DynamicContext } from 'ag-charts-core';

import type { DataSetSelectionsIterator } from './dataSelectionUtil';
import { DataSetSelection } from './dataSetSelection';

const { SelectionState } = _ModuleSupport;

type ChartRegistry = _ModuleSupport.ChartRegistry;
type DataChangeDescription = _ModuleSupport.DataChangeDescription;
type DataSet<T = unknown> = _ModuleSupport.DataSet<T>;
type IDataSelectionService = _ModuleSupport.IDataSelectionService;
type SelectionStateEnum = _ModuleSupport.SelectionState;
type SeriesLike = Parameters<IDataSelectionService['getDataSelectionState']>[0];

const selectionsInserter = (len: number) => new DataSetSelection(len);
const candidancyInserter = (len: number) => new Bitfield(len);

function getOrInsert<T>(map: Map<string, T>, key: string, data: DataSet, inserter: (len: number) => T): T {
    let entry: T | undefined = map.get(key);
    if (!entry) {
        entry = inserter(data.data.length);
        map.set(key, entry);
    }
    return entry;
}

export class DataSelectionService extends AbstractModuleInstance implements IDataSelectionService {
    public totalSelectedCount = 0;
    public totalCandidacyCount = 0;

    /** Per-series selection state. Keyed by `seriesId`. */
    readonly selections = new Map<string, DataSetSelection>();

    /** Per-series candidancy state. Keyed by `seriesId`. */
    private readonly candidancy = new Map<string, Bitfield>();

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {
        super();
        this.cleanup.register(
            () => this.clear(),
            () => this.clearCandidancy(),
            ctx.chartState.observe((get) => {
                const opts = get('options', 'selection');
                if (opts?.enabled === false) {
                    this.clearCandidancy();
                }
            })
        );
    }

    private clearCandidancy() {
        this.candidancy.clear();
    }

    clear(): void {
        for (const [_, selection] of this.selections) {
            selection.clear();
        }
        this.totalSelectedCount = 0;
    }

    /** Lazy-create a per-series selection backed by a Uint8Array of `data.length`. */
    enableSelection(seriesId: string, data: DataSet<unknown>): DataSetSelection {
        return getOrInsert(this.selections, seriesId, data, selectionsInserter);
    }

    enableCandidancy(seriesId: string, data: DataSet): Bitfield {
        return getOrInsert(this.candidancy, seriesId, data, candidancyInserter);
    }

    *iterateDataSetSelections(): Generator<DataSetSelectionsIterator> {
        if (this.ctx === undefined) return;

        const it: DataSetSelectionsIterator = {} as any;
        for (const series of this.ctx?.chartService.series) {
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
        if (this.selections.size === 0) return;

        const oldIds = oldDataSet.getIdArray();
        if (!oldIds) {
            if (oldDataSet.data.length === newDataSet.data.length) {
                // There's no dataId, but lengths are the same so assume the indices match to the same datums. This
                // assumption is not guaranteed, but is likely in most use cases. In the use cases where it isn't, it's
                // up the user to decide whether to call `chart.clearSelection()` or to integrate `dataIdKey`.
                //
                // Just copy the previous selection state:
                for (const [seriesId, oldSelObj] of this.selections) {
                    this.selections.set(seriesId, oldSelObj);
                }
            }
            return;
        }

        if (!newDataSet.dataIdKey || newDataSet.dataIdKey !== oldDataSet.dataIdKey) {
            return;
        }

        const newIdMap = newDataSet.getIdToIndexMap();
        for (const [seriesId, oldSelObj] of this.selections) {
            const oldSel = oldSelObj.getSelection();
            // Collect selected keys (transient Set, O(k) where k = selected count)
            const selectedKeys = new Set<string | number>();
            for (let i = 0; i < oldSel.length; i++) {
                const id = oldIds[i];
                if (oldSel[i] && id != null) selectedKeys.add(id);
            }
            if (selectedKeys.size === 0) continue;

            // Map into new index space (O(k) lookups)
            const newSelObj = this.enableSelection(seriesId, newDataSet);
            for (const key of selectedKeys) {
                const idx = newIdMap.get(key);
                if (idx != null) newSelObj.select(idx);
            }
            // selectedKeys GC'd after this scope
        }
    }

    applyDataChange(changeDescription: DataChangeDescription): void {
        if (this.selections.size > 0) {
            for (const sel of this.selections.values()) {
                sel.applyDataChange(changeDescription);
            }
        }
    }

    getDataSetSelection(series: SeriesLike): DataSetSelection | undefined {
        return this.selections?.get(series.id);
    }

    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionStateEnum | undefined {
        if (!series.properties.selection.enabled || this.ctx === undefined) return undefined;

        const options = this.ctx.chartState.getValue('options');
        if (!options?.selection?.enabled) return undefined;

        if (this.totalSelectedCount === 0 && this.totalCandidacyCount === 0) {
            return SelectionState.None;
        }

        // When aggregation is active, a rendered marker stands in for an
        // entire bucket. The bucket is considered selected if any of its
        // underlying datums is selected, regardless of which one happens to
        // be the bucket's representative index. Fall back to the per-datum
        // bitset when no aggregation level applies.
        const selectionBuffer = this.getDataSetSelection(series);
        const candidacyField = this.candidancy.get(series.id);
        if (typeof datumIndex === 'number') {
            if (candidacyField?.getBit(datumIndex) === 1) {
                return SelectionState.Item;
            }

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
