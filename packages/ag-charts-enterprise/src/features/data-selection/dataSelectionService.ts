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
type Observer = Parameters<DynamicContext<ChartRegistry>['chartState']['observe']>[0];
type ObserveGetter = Parameters<Observer>[0];

const selectionInserter = (len: number) => new DataSetSelection(len);
const candidacyInserter = (len: number) => new Bitfield(len);

function getOrInsert<T>(map: Map<string, T>, key: string, data: DataSet, inserter: (len: number) => T): T {
    let entry: T | undefined = map.get(key);
    if (!entry) {
        entry = inserter(data.size());
        map.set(key, entry);
    }
    return entry;
}

export class DataSelectionService extends AbstractModuleInstance implements IDataSelectionService {
    private moduleEnabled = false;

    public totalSelectedCount = 0;
    public totalCandidacyCount = 0;
    // The API states that the candidateState property must be undefined when no drag motion is in progress. This is
    // required to distinguish between these cases:
    // 1.  No drag motion is in progress.
    // 2.  A drag motion is in progress, but the candidacy list is empty.
    public candidacyInProgress = false;
    // The Control/Cmd keys can be used to add everything in candidacy to the existing selections rather than setting
    // the selection (i.e. the union of candidate + selection).
    public candidacyUnion = false;

    /** Per-series selection state. Keyed by `seriesId`. */
    selections = new Map<string, DataSetSelection>();

    /** Per-series candidacy state. Keyed by `seriesId`. */
    private readonly candidacy = new Map<string, Bitfield>();

    constructor(private readonly ctx?: DynamicContext<ChartRegistry>) {
        super();
        this.cleanup.register(
            () => this.clearSelection(),
            () => this.clearCandidacy(),
            ctx?.eventsHub.on('data:load', () => this.recountTotalSelections()),
            ctx?.eventsHub.on('data:update', () => this.recountTotalSelections()),
            ctx?.chartState.observe((get) => this.onObservation(get))
        );
    }

    private onObservation(get: ObserveGetter): void {
        get('options', 'series');
        this.recountTotalSelections();
    }

    private recountTotalSelections() {
        const shownIds = new Set(this.ctx?.chartService.series.map((s) => s.id));
        const savedIds = Array.from(this.selections.keys());
        for (const id of savedIds) {
            if (!shownIds.has(id)) {
                this.selections.delete(id);
            }
        }

        let sum = 0;
        for (const [_seriesId, selection] of this.selections) {
            sum += selection.getSelectedCount();
        }
        this.totalSelectedCount = sum;
    }

    private isSeriesSelectionEnabled(series: SeriesLike): boolean {
        return this.isEnabled() && this.ctx !== undefined && series.isSelectionEnabled();
    }

    isEnabled(): boolean {
        return this.moduleEnabled;
    }

    setEnabled(newEnabled: boolean): void {
        this.moduleEnabled = newEnabled;
        if (!newEnabled) {
            this.clearCandidacy();
        }
    }

    clearSelection(): void {
        for (const [_, selection] of this.selections) {
            selection.clear();
        }
        this.totalSelectedCount = 0;
    }

    clearCandidacy() {
        this.candidacy.clear();
        this.totalCandidacyCount = 0;
        this.candidacyInProgress = false;
    }

    /** Lazy-create a per-series selection backed by a Uint8Array of `data.length`. */
    enableSelection(seriesId: string, data: DataSet<unknown>): DataSetSelection {
        return getOrInsert(this.selections, seriesId, data, selectionInserter);
    }

    enableCandidacy(seriesId: string, data: DataSet): Bitfield {
        return getOrInsert(this.candidacy, seriesId, data, candidacyInserter);
    }

    *iterateDataSetSelections(): Generator<DataSetSelectionsIterator> {
        if (this.ctx === undefined) return;

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
        this.candidacy.clear();
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
            } else {
                this.selections.clear();
            }
            return;
        }

        if (!newDataSet.dataIdKey || newDataSet.dataIdKey !== oldDataSet.dataIdKey) {
            this.selections.clear();
            return;
        }

        const newIdMap = newDataSet.getIdToIndexMap();
        const oldSelections = this.selections;
        this.selections = new Map();
        for (const [seriesId, oldSelObj] of oldSelections) {
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

    onDataChange(changeDescription: DataChangeDescription): void {
        this.candidacy.clear();
        if (this.selections.size > 0) {
            for (const sel of this.selections.values()) {
                sel.applyDataChange(changeDescription);
            }
        }
        // The `data:update` event fires before transactions are committed, so its recount
        // sees stale per-series counts. Recount again here, once the commit has applied.
        this.recountTotalSelections();
    }

    getDataSetSelection(series: SeriesLike): DataSetSelection | undefined {
        return this.selections?.get(series.id);
    }

    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionStateEnum | undefined {
        if (!this.isSeriesSelectionEnabled(series)) return undefined;

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

    getDataCandidateState(series: SeriesLike, datumIndex: number | undefined): SelectionStateEnum | undefined {
        if (!this.candidacyInProgress || !this.isSeriesSelectionEnabled(series)) return undefined;

        if (this.candidacyUnion) {
            const selectedState = this.getDataSelectionState(series, datumIndex);
            if (selectedState === SelectionState.Item) {
                return SelectionState.Item;
            }
        }

        if (this.totalCandidacyCount === 0) {
            return SelectionState.None;
        }
        const candidacyField = this.candidacy.get(series.id);
        if (typeof datumIndex === 'number') {
            if (candidacyField?.getBit(datumIndex) === 1) {
                return SelectionState.Item;
            } else {
                return SelectionState.OtherItem;
            }
        }
        return SelectionState.OtherSeries;
    }
}
