import {
    AGGREGATION_INDEX_SELECTED,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    aggregationBucketForDatum,
    aggregationDatumMatchesIndex,
    aggregationDomain,
    collectSparseSelection,
    populateBucketSelectedFromSparse,
    populateBucketSelectedFromSparseSplit,
} from 'ag-charts-core';

import type { ChartAxis } from '../chartAxis';
import type { DataModel } from '../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../data/dataModelTypes';
import type { IDataSelectionService } from '../data/dataSelectionServiceTypes';
import { type AggregationFilterBase, type AggregationManager } from './aggregationManager';
import type { BucketLookupFeature, DatumRangeReader } from './seriesTypes';

export type { BucketLookupFeature } from './seriesTypes';

type SeriesLike = Parameters<IDataSelectionService['getDataSetSelection']>[0];

interface ExtremesFilter extends AggregationFilterBase {
    indexData: Uint32Array;
}

interface SplitFilter extends AggregationFilterBase {
    positiveIndexData: Uint32Array;
    negativeIndexData: Uint32Array;
}

interface BucketLookupManagerOpts<TFilter extends AggregationFilterBase> {
    series: SeriesLike;
    /** Resolved at lookup time — accessor pattern lets the series mutate axis/data references freely. */
    getXAxis: () => ChartAxis | undefined;
    getDataModel: () => DataModel<any, any, any> | undefined;
    getProcessedData: () => ProcessedData<any> | undefined;
    dataSelectionService: IDataSelectionService | undefined;
    aggregationManager: AggregationManager<TFilter>;
    /** `'value'` for series whose xValue column is the X coordinate (line); `'key'` for keyed series (bar/area/ohlc/range-*). */
    domainKey: 'value' | 'key';
    /**
     * AGGREGATION_INDEX_* slots whose stored datum index is treated as the
     * canonical "selected" representative for its bucket. When set, the
     * selection predicate additionally requires `datumIndex` to match one of
     * the configured slots — preventing the visual multiplication where a
     * single selected datum surfaces as up to four styled extrema markers per
     * bucket. When undefined, falls back to any-membership semantics
     * (composite-node series like OHLC/range-bar that already render one node
     * per bucket).
     */
    canonicalExtremaSlots?: readonly number[];
}

interface BucketingInputs {
    xValues: any[];
    d0: number;
    d1: number;
    xNeedsValueOf: boolean;
}

/**
 * Per-render-frame reader cache shared by both extremes and split managers.
 * Holds both the bucket-selected hot-path reader and the range reader keyed
 * on (`processedData`, filter) — both are invalidated together because both
 * close over the same resolved bucketing context.
 */
class LookupCache<TFilter> {
    processedData?: ProcessedData<any>;
    filter?: TFilter;
    selectedReader?: (datumIndex: number) => boolean;
    rangeReader?: DatumRangeReader;

    has(processedData: ProcessedData<any>, filter: TFilter): boolean {
        return this.processedData === processedData && this.filter === filter && this.selectedReader !== undefined;
    }

    set(
        processedData: ProcessedData<any>,
        filter: TFilter,
        selectedReader: (datumIndex: number) => boolean,
        rangeReader: DatumRangeReader
    ): void {
        this.processedData = processedData;
        this.filter = filter;
        this.selectedReader = selectedReader;
        this.rangeReader = rangeReader;
    }

    clear(): void {
        this.processedData = undefined;
        this.filter = undefined;
        this.selectedReader = undefined;
        this.rangeReader = undefined;
    }
}

function resolveBucketingInputs(
    series: ScopeProvider,
    xAxis: ChartAxis,
    dataModel: DataModel<any, any, any>,
    processedData: ProcessedData<any>,
    domainKey: 'value' | 'key'
): BucketingInputs {
    const domainInput = dataModel.getDomain(series, 'xValue', domainKey, processedData);
    const xValues =
        domainKey === 'key'
            ? dataModel.resolveKeysById(series, 'xValue', processedData)
            : dataModel.resolveColumnById(series, 'xValue', processedData, 'object');
    const xNeedsValueOf =
        domainKey === 'key' ? false : dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const [d0, d1] = aggregationDomain(xAxis.scale.type, domainInput);
    return { xValues, d0, d1, xNeedsValueOf };
}

/**
 * Per-filter epoch tracking: filters are populated for a given selection
 * epoch exactly once, and skipped on subsequent visits unless their epoch
 * tag is stale. Combined with WeakMap-keyed identity, this lets us
 * distinguish "selection changed, repopulate every level" from "filter set
 * grew (zoom demand), only populate the new entries" without an explicit
 * callback split on `AggregationManager`.
 *
 * The sparse selection list is rebuilt once per selection-change and reused
 * across every level whose epoch tag is behind. Cost per level is
 * `O(|selection|)` — typical user selections have Hamming weight ≪ N, so
 * pan/zoom adding a finer aggregation level is cheap regardless of dataset
 * size.
 */
abstract class AbstractBucketLookupManager<TFilter extends AggregationFilterBase> {
    private selectionEpoch = 0;
    private sparseSelection?: Uint32Array;
    private readonly populatedEpochs = new WeakMap<TFilter, number>();
    protected readonly cache = new LookupCache<TFilter>();

    constructor(protected readonly opts: BucketLookupManagerOpts<TFilter>) {
        opts.aggregationManager.events.on('filtersChanged', () => this.populateStaleFilters());
    }

    /** Render-pass entrypoint — series pushes the resolved filter directly, skipping the lazy axis-poll path. */
    setActiveFilter(processedData: ProcessedData<any>, filter: AggregationFilterBase | undefined): void {
        if (filter === undefined) {
            this.cache.clear();
            return;
        }
        const typedFilter = filter as TFilter;
        if (this.cache.has(processedData, typedFilter)) return;
        const dataModel = this.opts.getDataModel();
        const xAxis = this.opts.getXAxis();
        if (!dataModel || !xAxis) return;
        this.populateCache(typedFilter, dataModel, processedData, xAxis);
    }

    /**
     * Selection-change entrypoint (called from `Series` on
     * `data-selection-change`). Bumps the epoch so every existing filter
     * becomes stale, rebuilds the sparse selection list from the live
     * bitset, then walks the filter list populating any whose epoch tag
     * doesn't match the new value.
     */
    refresh(): void {
        this.selectionEpoch += 1;
        const selection = this.opts.dataSelectionService?.getDataSetSelection(this.opts.series)?.getSelection();
        this.sparseSelection = selection ? collectSparseSelection(selection) : undefined;
        this.populateStaleFilters();
    }

    /**
     * Filter-set-mutation entrypoint (subscribed to
     * `aggregationManager.events.on('filtersChanged', …)`). Doesn't bump
     * the epoch — existing filters' SELECTED slots are still valid for the
     * current selection — but newly-added filter objects aren't yet in
     * `populatedEpochs`, so they get populated on this pass.
     */
    private populateStaleFilters(): void {
        const filters = this.opts.aggregationManager.filters;
        if (!filters || filters.length === 0) {
            this.invalidateCache();
            return;
        }

        const xAxis = this.opts.getXAxis();
        const dataModel = this.opts.getDataModel();
        const processedData = this.opts.getProcessedData();
        if (!xAxis || !dataModel || !processedData) return;

        const sparse = this.sparseSelection;
        if (sparse === undefined) {
            // Selection cleared / never set: just zero out the SELECTED slot
            // on stale filters.
            for (const f of filters) {
                if (this.populatedEpochs.get(f) === this.selectionEpoch) continue;
                this.clearSelectedSlot(f);
                this.populatedEpochs.set(f, this.selectionEpoch);
            }
            return;
        }

        // Resolve bucketing context once — `xValues`, `d0`, `d1` don't vary
        // with the filter's `maxRange`.
        const inputs = resolveBucketingInputs(this.opts.series, xAxis, dataModel, processedData, this.opts.domainKey);

        for (const f of filters) {
            if (this.populatedEpochs.get(f) === this.selectionEpoch) continue;
            this.populateFilter(f, sparse, inputs);
            this.populatedEpochs.set(f, this.selectionEpoch);
        }
    }

    isBucketSelected(datumIndex: number): boolean | undefined {
        // Hot path: setActiveFilter primes the cache each render pass, so ensureReaders is rare.
        return (this.cache.selectedReader ?? this.ensureReaders()?.selectedReader)?.(datumIndex);
    }

    getRangeReader(): DatumRangeReader | undefined {
        return this.cache.rangeReader ?? this.ensureReaders()?.rangeReader;
    }

    getIndexSet(_datumIndex: number): Iterable<number> | undefined {
        return undefined;
    }

    /** Lazy fallback for callers that haven't primed the cache via {@link setActiveFilter} (e.g. drag-select). */
    protected ensureReaders(): LookupCache<TFilter> | undefined {
        const xAxis = this.opts.getXAxis();
        const processedData = this.opts.getProcessedData();
        const dataModel = this.opts.getDataModel();
        if (!xAxis || !processedData || !dataModel) return undefined;

        const [r0, r1] = xAxis.scale.range;
        const filter = this.opts.aggregationManager.getFilterForRange(Math.abs(r1 - r0));
        if (!filter) {
            this.cache.clear();
            return undefined;
        }

        if (this.cache.has(processedData, filter)) return this.cache;
        return this.populateCache(filter, dataModel, processedData, xAxis);
    }

    protected invalidateCache(): void {
        this.cache.clear();
    }

    protected abstract populateCache(
        filter: TFilter,
        dataModel: DataModel<any, any, any>,
        processedData: ProcessedData<any>,
        xAxis: ChartAxis
    ): LookupCache<TFilter> | undefined;
    protected abstract clearSelectedSlot(filter: TFilter): void;
    protected abstract populateFilter(filter: TFilter, sparse: Uint32Array, inputs: BucketingInputs): void;
}

/**
 * Bucket lookup roll-up for series whose aggregation filter exposes a single
 * `indexData` array (line, area, OHLC/candlestick, range-bar, range-area).
 */
export class BucketLookupManager<TFilter extends ExtremesFilter>
    extends AbstractBucketLookupManager<TFilter>
    implements BucketLookupFeature
{
    protected override clearSelectedSlot(filter: TFilter): void {
        const { indexData, maxRange } = filter;
        for (let i = 0; i < maxRange; i++) {
            indexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_SELECTED] = 0;
        }
    }

    protected override populateFilter(filter: TFilter, sparse: Uint32Array, inputs: BucketingInputs): void {
        populateBucketSelectedFromSparse(
            sparse,
            filter.indexData,
            filter.maxRange,
            inputs.xValues,
            inputs.d0,
            inputs.d1,
            inputs.xNeedsValueOf
        );
    }

    protected override populateCache(
        filter: TFilter,
        dataModel: DataModel<any, any, any>,
        processedData: ProcessedData<any>,
        xAxis: ChartAxis
    ): LookupCache<TFilter> {
        const { xValues, d0, d1, xNeedsValueOf } = resolveBucketingInputs(
            this.opts.series,
            xAxis,
            dataModel,
            processedData,
            this.opts.domainKey
        );
        const xValuesLength = xValues.length;
        const { indexData, maxRange } = filter;
        const canonicalSlots = this.opts.canonicalExtremaSlots;

        function readSelectedExtremes(datumIndex: number): boolean {
            const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, {
                xNeedsValueOf,
                xValuesLength,
            });
            if (bucket < 0 || indexData[bucket + AGGREGATION_INDEX_SELECTED] !== 1) return false;
            if (canonicalSlots === undefined) return true;
            for (let i = 0; i < canonicalSlots.length; i++) {
                if (indexData[bucket + canonicalSlots[i]] === datumIndex) return true;
            }
            return false;
        }

        function readRangeExtremes(sampleDatumIndex: number): [number, number] | undefined {
            const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, sampleDatumIndex, {
                xNeedsValueOf,
                xValuesLength,
            });
            if (bucket < 0) return undefined;
            return [indexData[bucket + AGGREGATION_INDEX_X_MIN], indexData[bucket + AGGREGATION_INDEX_X_MAX]];
        }

        this.cache.set(processedData, filter, readSelectedExtremes, readRangeExtremes);
        return this.cache;
    }
}

interface SplitBucketLookupManagerOpts<TFilter extends SplitFilter> extends BucketLookupManagerOpts<TFilter> {
    /**
     * Returns the data-model column id resolving to the y-end values used to
     * discriminate positive/negative arms. Bar's column varies (`yValue-end`
     * vs `yValue-raw` depending on stacking), so it's a getter.
     */
    getYColumnId: (dataModel: DataModel<any, any, any>, processedData: ProcessedData<any>) => string;
}

const SPLIT_RANGE_OFFSETS = [
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_INDEX_Y_MAX,
];

/**
 * Bucket lookup roll-up for bar-style series whose aggregation filter splits
 * each bucket into positive and negative arms. Selection lookup is sign-aware
 * (reads only the matching arm) and the range reader matches the picked
 * representative against the extrema indices in either arm to determine which
 * bucket bounds to return.
 */
export class SplitBucketLookupManager<TFilter extends SplitFilter>
    extends AbstractBucketLookupManager<TFilter>
    implements BucketLookupFeature
{
    constructor(private readonly splitOpts: SplitBucketLookupManagerOpts<TFilter>) {
        super(splitOpts);
    }

    protected override clearSelectedSlot(filter: TFilter): void {
        const { positiveIndexData, negativeIndexData, maxRange } = filter;
        for (let i = 0; i < maxRange; i++) {
            const aggIndex = i * AGGREGATION_SPAN + AGGREGATION_INDEX_SELECTED;
            positiveIndexData[aggIndex] = 0;
            negativeIndexData[aggIndex] = 0;
        }
    }

    protected override populateFilter(filter: TFilter, sparse: Uint32Array, inputs: BucketingInputs): void {
        const dataModel = this.splitOpts.getDataModel()!;
        const processedData = this.splitOpts.getProcessedData()!;
        const yColumnId = this.splitOpts.getYColumnId(dataModel, processedData);
        const yEndValues = dataModel.resolveColumnById(
            this.splitOpts.series,
            yColumnId,
            processedData,
            'mixed-numeric'
        );
        const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(this.splitOpts.series, yColumnId, processedData);

        populateBucketSelectedFromSparseSplit(
            sparse,
            filter.positiveIndexData,
            filter.negativeIndexData,
            filter.maxRange,
            inputs.xValues,
            yEndValues,
            inputs.d0,
            inputs.d1,
            inputs.xNeedsValueOf,
            yNeedsValueOf
        );
    }

    protected override populateCache(
        filter: TFilter,
        dataModel: DataModel<any, any, any>,
        processedData: ProcessedData<any>,
        xAxis: ChartAxis
    ): LookupCache<TFilter> {
        const { xValues, d0, d1, xNeedsValueOf } = resolveBucketingInputs(
            this.splitOpts.series,
            xAxis,
            dataModel,
            processedData,
            this.splitOpts.domainKey
        );
        const yColumnId = this.splitOpts.getYColumnId(dataModel, processedData);
        const yEndValues = dataModel.resolveColumnById(
            this.splitOpts.series,
            yColumnId,
            processedData,
            'mixed-numeric'
        );
        const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(this.splitOpts.series, yColumnId, processedData);
        const xValuesLength = xValues.length;
        const { positiveIndexData, negativeIndexData, maxRange } = filter;
        const canonicalSlots = this.splitOpts.canonicalExtremaSlots;

        function readSelectedSplit(datumIndex: number): boolean {
            const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, {
                xNeedsValueOf,
                xValuesLength,
            });
            if (bucket < 0) return false;

            const yEnd = yEndValues[datumIndex];
            if (yEnd == null) return false;
            const yMax = yNeedsValueOf ? yEnd.valueOf() : yEnd;
            const arm = yMax >= 0 ? positiveIndexData : negativeIndexData;
            if (arm[bucket + AGGREGATION_INDEX_SELECTED] !== 1) return false;
            if (canonicalSlots === undefined) return true;
            for (let i = 0; i < canonicalSlots.length; i++) {
                if (arm[bucket + canonicalSlots[i]] === datumIndex) return true;
            }
            return false;
        }

        function readRangeSplit(sampleDatumIndex: number): [number, number] | undefined {
            const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, sampleDatumIndex, {
                xNeedsValueOf,
                xValuesLength,
            });
            if (bucket < 0) return undefined;

            // Bar splits buckets by sign — match the picked datum against extrema indices on either arm.
            let data: Uint32Array | undefined;
            if (aggregationDatumMatchesIndex(positiveIndexData, bucket, sampleDatumIndex, SPLIT_RANGE_OFFSETS)) {
                data = positiveIndexData;
            } else if (aggregationDatumMatchesIndex(negativeIndexData, bucket, sampleDatumIndex, SPLIT_RANGE_OFFSETS)) {
                data = negativeIndexData;
            }
            if (!data) return undefined;
            return [data[bucket + AGGREGATION_INDEX_X_MIN], data[bucket + AGGREGATION_INDEX_X_MAX]];
        }

        this.cache.set(processedData, filter, readSelectedSplit, readRangeSplit);
        return this.cache;
    }
}

interface IndexSetBucketLookupManagerOpts {
    series: SeriesLike;
    dataSelectionService: IDataSelectionService | undefined;
    /** Cluster-keyed map of representative datum index to underlying datum indices. */
    getIndexSetMap: () => Map<number, number[]> | undefined;
}

/**
 * Bucket lookup roll-up for cluster-based aggregation (bubble/scatter). Each
 * rendered marker stands in for an arbitrary group of datums whose underlying
 * indices are non-contiguous, so neither the extremes-based range reader nor
 * the per-bucket SELECTED slot model from {@link BucketLookupManager} apply
 * here — the selection bit per cluster is read by walking the cluster's
 * index list against the per-series selection bitset.
 *
 * No precomputed roll-up: clusters are typically small (a few datums each)
 * and each marker render performs at most one lookup per cluster, so an
 * O(cluster-size) scan beats maintaining a parallel cache that has to be
 * invalidated on every selection change.
 */
export class IndexSetBucketLookupManager implements BucketLookupFeature {
    constructor(private readonly opts: IndexSetBucketLookupManagerOpts) {}

    isBucketSelected(datumIndex: number): boolean | undefined {
        const map = this.opts.getIndexSetMap();
        if (map === undefined) return undefined;
        const indices = map.get(datumIndex);
        if (indices === undefined) return undefined;
        const selection = this.opts.dataSelectionService?.getDataSetSelection(this.opts.series)?.getSelection();
        if (selection === undefined) return false;
        for (let i = 0; i < indices.length; i++) {
            if (selection[indices[i]] === 1) return true;
        }
        return false;
    }

    getRangeReader(): DatumRangeReader | undefined {
        return undefined;
    }

    getIndexSet(datumIndex: number): Iterable<number> | undefined {
        return this.opts.getIndexSetMap()?.get(datumIndex);
    }

    refresh(): void {
        // No-op: cluster lookups read the live selection bitset lazily, so there is no cache to invalidate.
    }

    setActiveFilter(): void {
        // No-op: cluster-based aggregation doesn't depend on the active filter.
    }
}
