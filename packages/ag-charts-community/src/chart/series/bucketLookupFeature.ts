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
    computeBucketSelection,
    computeBucketSelectionSplit,
    propagateBucketSelection,
} from 'ag-charts-core';

import type { ChartAxis } from '../chartAxis';
import type { DataModel } from '../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../data/dataModelTypes';
import { type AggregationFilterBase, type AggregationManager } from './aggregationManager';
import type { BucketLookupFeature, DatumRangeReader } from './seriesTypes';

export type { BucketLookupFeature } from './seriesTypes';

interface ExtremesFilter extends AggregationFilterBase {
    indexData: Uint32Array;
}

interface SplitFilter extends AggregationFilterBase {
    positiveIndexData: Uint32Array;
    negativeIndexData: Uint32Array;
}

interface BucketLookupManagerOpts<TFilter extends AggregationFilterBase> {
    series: ScopeProvider;
    /** Resolved at lookup time — accessor pattern lets the series mutate axis/data references freely. */
    getXAxis: () => ChartAxis | undefined;
    getDataModel: () => DataModel<any, any, any> | undefined;
    getProcessedData: () => ProcessedData<any> | undefined;
    aggregationManager: AggregationManager<TFilter>;
    /** `'value'` for series whose xValue column is the X coordinate (line); `'key'` for keyed series (bar/area/ohlc/range-*). */
    domainKey: 'value' | 'key';
    getSelection: () => Uint8Array | undefined;
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
            : dataModel.resolveColumnById(series, 'xValue', processedData);
    const xNeedsValueOf =
        domainKey === 'key' ? false : dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const [d0, d1] = aggregationDomain(xAxis.scale.type, domainInput);
    return { xValues, d0, d1, xNeedsValueOf };
}

/**
 * Bucket lookup roll-up for series whose aggregation filter exposes a single
 * `indexData` array (line, area, OHLC/candlestick, range-bar, range-area).
 *
 * Both readers (bucket-selected and range) are built once per active filter
 * and share the prepared bucketing context — `getDataSelectionState` won't
 * recompute the aggregation domain on every marker.
 */
export class BucketLookupManager<TFilter extends ExtremesFilter> implements BucketLookupFeature {
    private readonly cache = new LookupCache<TFilter>();

    constructor(private readonly opts: BucketLookupManagerOpts<TFilter>) {}

    isBucketSelected(datumIndex: number): boolean | undefined {
        return this.ensureReaders()?.selectedReader?.(datumIndex);
    }

    getRangeReader(): DatumRangeReader | undefined {
        return this.ensureReaders()?.rangeReader;
    }

    refresh(): void {
        const filters = this.opts.aggregationManager.filters;
        if (!filters || filters.length === 0) {
            // Filters dropped (e.g. by markStale on a >=2x data resize). Drop
            // the cached readers too — they close over the old indexData
            // TypedArrays which can be sizeable on large datasets.
            this.cache.clear();
            return;
        }

        const xAxis = this.opts.getXAxis();
        const dataModel = this.opts.getDataModel();
        const processedData = this.opts.getProcessedData();
        if (!xAxis || !dataModel || !processedData) return;

        const selection = this.opts.getSelection();
        if (selection === undefined) {
            for (const f of filters) {
                for (let i = 0; i < f.maxRange; i++) {
                    f.indexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_SELECTED] = 0;
                }
            }
            return;
        }

        const { xValues, d0, d1, xNeedsValueOf } = resolveBucketingInputs(
            this.opts.series,
            xAxis,
            dataModel,
            processedData,
            this.opts.domainKey
        );

        // Filters are sorted ascending by maxRange — the last entry is the finest level.
        const finest = filters.at(-1)!;
        computeBucketSelection(selection, finest.indexData, finest.maxRange, xValues, d0, d1, xNeedsValueOf);

        for (let i = filters.length - 2; i >= 0; i--) {
            propagateBucketSelection(filters[i].indexData, filters[i + 1].indexData, filters[i].maxRange);
        }
    }

    private ensureReaders(): LookupCache<TFilter> | undefined {
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

        const { xValues, d0, d1, xNeedsValueOf } = resolveBucketingInputs(
            this.opts.series,
            xAxis,
            dataModel,
            processedData,
            this.opts.domainKey
        );
        const xValuesLength = xValues.length;
        const { indexData, maxRange } = filter;

        const selectedReader = (datumIndex: number): boolean => {
            const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, {
                xNeedsValueOf,
                xValuesLength,
            });
            return bucket >= 0 && indexData[bucket + AGGREGATION_INDEX_SELECTED] === 1;
        };

        const rangeReader: DatumRangeReader = (sampleDatumIndex: number) => {
            const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, sampleDatumIndex, {
                xNeedsValueOf,
                xValuesLength,
            });
            if (bucket < 0) return undefined;
            return [indexData[bucket + AGGREGATION_INDEX_X_MIN], indexData[bucket + AGGREGATION_INDEX_X_MAX]];
        };

        this.cache.set(processedData, filter, selectedReader, rangeReader);
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
 * each bucket into positive and negative arms (`positiveIndexData` /
 * `negativeIndexData`).
 *
 * Each datum lives in exactly one arm based on its y-end value sign; the
 * rendered bar at a given x-position similarly belongs to one arm. Selection
 * lookup is sign-aware (reads only the matching arm) and the range reader
 * matches the picked representative against the extrema indices in either
 * arm to determine which bucket bounds to return.
 */
export class SplitBucketLookupManager<TFilter extends SplitFilter> implements BucketLookupFeature {
    private readonly cache = new LookupCache<TFilter>();

    constructor(private readonly opts: SplitBucketLookupManagerOpts<TFilter>) {}

    isBucketSelected(datumIndex: number): boolean | undefined {
        return this.ensureReaders()?.selectedReader?.(datumIndex);
    }

    getRangeReader(): DatumRangeReader | undefined {
        return this.ensureReaders()?.rangeReader;
    }

    refresh(): void {
        const filters = this.opts.aggregationManager.filters;
        if (!filters || filters.length === 0) {
            // Filters dropped (e.g. by markStale on a >=2x data resize). Drop
            // the cached readers too — they close over the old indexData
            // TypedArrays which can be sizeable on large datasets.
            this.cache.clear();
            return;
        }

        const xAxis = this.opts.getXAxis();
        const dataModel = this.opts.getDataModel();
        const processedData = this.opts.getProcessedData();
        if (!xAxis || !dataModel || !processedData) return;

        const selection = this.opts.getSelection();
        if (selection === undefined) {
            for (const f of filters) {
                for (let i = 0; i < f.maxRange; i++) {
                    f.positiveIndexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_SELECTED] = 0;
                    f.negativeIndexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_SELECTED] = 0;
                }
            }
            return;
        }

        const { xValues, d0, d1, xNeedsValueOf } = resolveBucketingInputs(
            this.opts.series,
            xAxis,
            dataModel,
            processedData,
            this.opts.domainKey
        );
        const yColumnId = this.opts.getYColumnId(dataModel, processedData);
        const yEndValues = dataModel.resolveColumnById(this.opts.series, yColumnId, processedData);
        const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(this.opts.series, yColumnId, processedData);

        const finest = filters.at(-1)!;
        computeBucketSelectionSplit(
            selection,
            finest.positiveIndexData,
            finest.negativeIndexData,
            finest.maxRange,
            xValues,
            yEndValues,
            d0,
            d1,
            xNeedsValueOf,
            yNeedsValueOf
        );

        for (let i = filters.length - 2; i >= 0; i--) {
            propagateBucketSelection(
                filters[i].positiveIndexData,
                filters[i + 1].positiveIndexData,
                filters[i].maxRange
            );
            propagateBucketSelection(
                filters[i].negativeIndexData,
                filters[i + 1].negativeIndexData,
                filters[i].maxRange
            );
        }
    }

    private ensureReaders(): LookupCache<TFilter> | undefined {
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

        const { xValues, d0, d1, xNeedsValueOf } = resolveBucketingInputs(
            this.opts.series,
            xAxis,
            dataModel,
            processedData,
            this.opts.domainKey
        );
        const yColumnId = this.opts.getYColumnId(dataModel, processedData);
        const yEndValues = dataModel.resolveColumnById(this.opts.series, yColumnId, processedData);
        const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(this.opts.series, yColumnId, processedData);
        const xValuesLength = xValues.length;
        const { positiveIndexData, negativeIndexData, maxRange } = filter;

        const selectedReader = (datumIndex: number): boolean => {
            const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, {
                xNeedsValueOf,
                xValuesLength,
            });
            if (bucket < 0) return false;

            const yEnd = yEndValues[datumIndex];
            if (yEnd == null) return false;
            const yMax = yNeedsValueOf ? yEnd.valueOf() : yEnd;
            const arm = yMax >= 0 ? positiveIndexData : negativeIndexData;
            return arm[bucket + AGGREGATION_INDEX_SELECTED] === 1;
        };

        const rangeReader: DatumRangeReader = (sampleDatumIndex: number) => {
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
        };

        this.cache.set(processedData, filter, selectedReader, rangeReader);
        return this.cache;
    }
}
