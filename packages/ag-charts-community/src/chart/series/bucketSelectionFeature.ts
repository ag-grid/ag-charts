import {
    AGGREGATION_INDEX_SELECTED,
    AGGREGATION_SPAN,
    aggregationBucketForDatum,
    aggregationDomain,
    computeBucketSelection,
    computeBucketSelectionSplit,
    propagateBucketSelection,
} from 'ag-charts-core';

import type { ChartAxis } from '../chartAxis';
import type { DataModel } from '../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../data/dataModelTypes';
import { type AggregationFilterBase, type AggregationManager } from './aggregationManager';

/**
 * Common interface every aggregating series exposes to the series base.
 *
 * `Series` owns an optional `bucketSelection` field of this type. The base
 * uses it to resolve the per-bucket SELECTED roll-up for marker styling and
 * to refresh that roll-up after a selection change. Concrete implementations
 * are constructed lazily by series-specific `createBucketSelectionFeature()`
 * overrides only when the data-selection feature is in play.
 */
export interface BucketSelectionFeature {
    /**
     * Whether the bucket containing `datumIndex` at the active zoom level
     * contains any selected datums. Returns `undefined` when no aggregation
     * level is active for the current view — caller falls back to the
     * per-datum bitset.
     */
    isBucketSelected(datumIndex: number): boolean | undefined;

    /**
     * Recompute the per-bucket SELECTED slot across every cached aggregation
     * level. Invoked from `data-selection-change` (selection bitset mutated)
     * and after `AggregationManager.aggregate({ onChange })` (filter set
     * rebuilt or extended).
     */
    refresh(): void;
}

interface ExtremesFilter extends AggregationFilterBase {
    indexData: Uint32Array;
}

interface SplitFilter extends AggregationFilterBase {
    positiveIndexData: Uint32Array;
    negativeIndexData: Uint32Array;
}

interface BucketSelectionManagerOpts<TFilter extends AggregationFilterBase> {
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

/** Per-render-frame reader cache shared by both extremes and split managers. */
class ReaderCache<TFilter, TReader> {
    processedData?: ProcessedData<any>;
    filter?: TFilter;
    reader?: TReader;

    has(processedData: ProcessedData<any>, filter: TFilter): boolean {
        return this.processedData === processedData && this.filter === filter && this.reader !== undefined;
    }

    set(processedData: ProcessedData<any>, filter: TFilter, reader: TReader): void {
        this.processedData = processedData;
        this.filter = filter;
        this.reader = reader;
    }

    clear(): void {
        this.processedData = undefined;
        this.filter = undefined;
        this.reader = undefined;
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
 * Bucket-selection roll-up for series whose aggregation filter exposes a
 * single `indexData` array (line, area, OHLC/candlestick, range-bar,
 * range-area).
 *
 * Caches the per-marker reader closure per (`processedData`, filter) pair so
 * `getDataSelectionState` doesn't recompute the aggregation domain on every
 * marker on the render hot path.
 */
export class BucketSelectionManager<TFilter extends ExtremesFilter> implements BucketSelectionFeature {
    private readonly cache = new ReaderCache<TFilter, (datumIndex: number) => boolean>();

    constructor(private readonly opts: BucketSelectionManagerOpts<TFilter>) {}

    isBucketSelected(datumIndex: number): boolean | undefined {
        const reader = this.getReader();
        return reader?.(datumIndex);
    }

    refresh(): void {
        const filters = this.opts.aggregationManager.filters;
        if (!filters || filters.length === 0) return;

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

    private getReader(): ((datumIndex: number) => boolean) | undefined {
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

        if (this.cache.has(processedData, filter)) return this.cache.reader;

        const { xValues, d0, d1, xNeedsValueOf } = resolveBucketingInputs(
            this.opts.series,
            xAxis,
            dataModel,
            processedData,
            this.opts.domainKey
        );
        const xValuesLength = xValues.length;
        const { indexData, maxRange } = filter;

        const reader = (datumIndex: number): boolean => {
            const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, {
                xNeedsValueOf,
                xValuesLength,
            });
            return bucket >= 0 && indexData[bucket + AGGREGATION_INDEX_SELECTED] === 1;
        };

        this.cache.set(processedData, filter, reader);
        return reader;
    }
}

interface SplitBucketSelectionManagerOpts<TFilter extends SplitFilter> extends BucketSelectionManagerOpts<TFilter> {
    /**
     * Returns the data-model column id resolving to the y-end values used to
     * discriminate positive/negative arms. Bar's column varies (`yValue-end`
     * vs `yValue-raw` depending on stacking), so it's a getter.
     */
    getYColumnId: (dataModel: DataModel<any, any, any>, processedData: ProcessedData<any>) => string;
}

/**
 * Bucket-selection roll-up for bar-style series whose aggregation filter
 * splits each bucket into positive and negative arms (`positiveIndexData` /
 * `negativeIndexData`). Each datum lives in exactly one arm based on its
 * y-end value sign — the rendered bar at a given x-position similarly
 * belongs to one arm, so the SELECTED lookup is sign-aware rather than
 * OR-ing both sides.
 */
export class SplitBucketSelectionManager<TFilter extends SplitFilter> implements BucketSelectionFeature {
    private readonly cache = new ReaderCache<TFilter, (datumIndex: number) => boolean>();

    constructor(private readonly opts: SplitBucketSelectionManagerOpts<TFilter>) {}

    isBucketSelected(datumIndex: number): boolean | undefined {
        const reader = this.getReader();
        return reader?.(datumIndex);
    }

    refresh(): void {
        const filters = this.opts.aggregationManager.filters;
        if (!filters || filters.length === 0) return;

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

    private getReader(): ((datumIndex: number) => boolean) | undefined {
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

        if (this.cache.has(processedData, filter)) return this.cache.reader;

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

        const reader = (datumIndex: number): boolean => {
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

        this.cache.set(processedData, filter, reader);
        return reader;
    }
}
