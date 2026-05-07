import {
    AGGREGATION_INDEX_SELECTED,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_SPAN,
    aggregationBucketForDatum,
    aggregationDomain,
    computeBucketSelection,
    propagateBucketSelection,
} from 'ag-charts-core';

import type { ChartAxis } from '../chartAxis';
import type { DataModel } from '../data/dataModel';
import type { ProcessedData, ScopeProvider } from '../data/dataModelTypes';
import { type AggregationFilterBase, type AggregationManager } from './aggregationManager';
import type { DatumRangeReader } from './seriesTypes';

interface ExtremesFilter extends AggregationFilterBase {
    indexData: Uint32Array;
}

/** Resolved aggregation bucket lookup state, ready to compute per-datum ranges. */
export interface AggregateBucketContext<TFilter> {
    xValues: any[];
    d0: number;
    d1: number;
    filter: TFilter;
}

interface AggregateBucketContextOpts<TFilter extends AggregationFilterBase> {
    series: ScopeProvider;
    xAxis: ChartAxis | undefined;
    dataModel: DataModel<any, any, any> | undefined;
    processedData: ProcessedData<any> | undefined;
    aggregationManager: AggregationManager<TFilter>;
    domainKey: 'value' | 'key';
}

/**
 * Resolve the shared inputs every aggregation-aware series needs to translate
 * a picked sample datum index into a bucket and back to a raw range:
 *
 * - `xValues`: array used by the aggregation builder for this series — keys
 *   for `'key'`-domain series (bar/area/ohlc/range-*), columns for `'value'`-
 *   domain series (line). Must match the builder so `aggregationBucketForDatum`
 *   resolves to the same bucket the index data was written under.
 * - `d0`/`d1`: the numeric x-domain matching the bucket grid.
 * - `filter`: the aggregation filter active at the current zoom level.
 *
 * Returns `undefined` when the data model isn't ready or no aggregation level
 * is currently active.
 */
export function prepareAggregateBucketContext<TFilter extends AggregationFilterBase>(
    opts: AggregateBucketContextOpts<TFilter>
): AggregateBucketContext<TFilter> | undefined {
    const { series, xAxis, dataModel, processedData, aggregationManager, domainKey } = opts;
    if (!xAxis || !dataModel || !processedData) return undefined;

    const domainInput = dataModel.getDomain(series, 'xValue', domainKey, processedData);
    const xValues =
        domainKey === 'key'
            ? dataModel.resolveKeysById(series, 'xValue', processedData)
            : dataModel.resolveColumnById(series, 'xValue', processedData);

    const [r0, r1] = xAxis.scale.range;
    const [d0, d1] = aggregationDomain(xAxis.scale.type, domainInput);

    const filter = aggregationManager.getFilterForRange(Math.abs(r1 - r0));
    if (!filter) return undefined;

    return { xValues, d0, d1, filter };
}

/**
 * Build a {@link DatumRangeReader} for series whose aggregation filter exposes a
 * single `indexData` Uint32Array with `AGGREGATION_INDEX_X_MIN/_MAX` slots
 * (line, area, OHLC, range-bar, range-area).
 *
 * Series with split positive/negative arrays (bar) should call
 * {@link prepareAggregateBucketContext} directly and write their own closure
 * — the lookup step there needs side-selection logic this helper deliberately
 * doesn't model.
 */
export function makeAggregateRangeReader<TFilter extends ExtremesFilter>(
    opts: AggregateBucketContextOpts<TFilter>
): DatumRangeReader | undefined {
    const ctx = prepareAggregateBucketContext(opts);
    if (!ctx) return undefined;

    const { xValues, d0, d1, filter } = ctx;

    return function getRangeOfAggregateIndex(sampleDatumIndex: number): [number, number] {
        const bucket = aggregationBucketForDatum(xValues, d0, d1, filter.maxRange, sampleDatumIndex, {
            xValuesLength: xValues.length,
        });

        return [filter.indexData[bucket + AGGREGATION_INDEX_X_MIN], filter.indexData[bucket + AGGREGATION_INDEX_X_MAX]];
    };
}

export type BucketSelectionReader = (datumIndex: number) => boolean;

/**
 * Mutable holder used by {@link getCachedBucketSelectionReader} to keep a
 * per-series reader alive across marker queries. The cache invalidates when
 * either the active filter or `processedData` reference changes — those are
 * the only inputs to the bucket-lookup math that can vary at render time.
 */
export interface BucketSelectionReaderCache<TFilter> {
    processedData?: ProcessedData<any>;
    filter?: TFilter;
    reader?: BucketSelectionReader;
}

/**
 * Build a cached "is the bucket containing this datum selected?" reader for
 * the active zoom level. Returns `undefined` when no aggregation level is
 * active (the caller falls back to the per-datum bitset).
 *
 * The reader closes over a single resolved context (`xValues`, `d0`, `d1`,
 * `filter`), so callers can keep the returned closure and re-use it across
 * many marker queries within a single render — avoiding the per-marker cost
 * of re-resolving the data-model column and recomputing the aggregation
 * domain. Rebuild it when either the active filter or `processedData`
 * reference changes.
 */
export function makeBucketSelectionReader<TFilter extends ExtremesFilter>(
    opts: AggregateBucketContextOpts<TFilter>
): BucketSelectionReader | undefined {
    const ctx = prepareAggregateBucketContext(opts);
    if (!ctx) return undefined;

    const { xValues, d0, d1, filter } = ctx;
    const xValuesLength = xValues.length;
    const { indexData, maxRange } = filter;

    return function isBucketSelected(datumIndex: number): boolean {
        const bucket = aggregationBucketForDatum(xValues, d0, d1, maxRange, datumIndex, {
            xValuesLength,
        });
        return bucket >= 0 && indexData[bucket + AGGREGATION_INDEX_SELECTED] === 1;
    };
}

/**
 * Resolve the active aggregation filter for the current zoom and return a
 * {@link BucketSelectionReader}, reusing the previously-built closure stored
 * in `cache` whenever the (`processedData`, filter) pair is unchanged.
 *
 * `getDataSelectionState` is called once per visible marker on the render
 * hot path, so building a fresh closure (which re-resolves the data-model
 * column and recomputes the aggregation domain) per call dominates frame
 * time. The cache lets the closure live for the duration of a render frame.
 */
export function getCachedBucketSelectionReader<TFilter extends ExtremesFilter>(
    cache: BucketSelectionReaderCache<TFilter>,
    opts: AggregateBucketContextOpts<TFilter>
): BucketSelectionReader | undefined {
    const { xAxis, processedData, aggregationManager } = opts;
    if (!xAxis || !processedData) return undefined;

    const [r0, r1] = xAxis.scale.range;
    const filter = aggregationManager.getFilterForRange(Math.abs(r1 - r0));
    if (!filter) {
        cache.processedData = undefined;
        cache.filter = undefined;
        cache.reader = undefined;
        return undefined;
    }

    if (cache.processedData === processedData && cache.filter === filter && cache.reader) {
        return cache.reader;
    }

    const reader = makeBucketSelectionReader(opts);
    cache.processedData = processedData;
    cache.filter = filter;
    cache.reader = reader;
    return reader;
}

interface RefreshAggregationBucketSelectionOpts<TFilter extends ExtremesFilter>
    extends Omit<AggregateBucketContextOpts<TFilter>, 'aggregationManager'> {
    filters: TFilter[] | undefined;
    selection: Uint8Array | undefined;
}

/**
 * Recompute the per-bucket SELECTED slot across every cached aggregation level
 * for a single-`indexData` series (line, area, OHLC, range-bar, range-area).
 *
 * The finest level is recomputed by full-bucket scan against the current
 * selection bitset; coarser levels are then propagated up the pyramid via
 * `OR` of their two finer children. Extrema slots are left untouched.
 *
 * Call this whenever the per-datum selection changes — without it, the
 * SELECTED slot is whatever was last computed at aggregation-build time and
 * will not reflect runtime selection changes.
 */
export function refreshAggregationBucketSelection<TFilter extends ExtremesFilter>(
    opts: RefreshAggregationBucketSelectionOpts<TFilter>
): void {
    const { series, xAxis, dataModel, processedData, domainKey, filters, selection } = opts;
    if (!filters || filters.length === 0) return;
    if (!xAxis || !dataModel || !processedData) return;

    if (selection === undefined) {
        for (const f of filters) {
            for (let i = 0; i < f.maxRange; i++) {
                f.indexData[i * AGGREGATION_SPAN + AGGREGATION_INDEX_SELECTED] = 0;
            }
        }
        return;
    }

    const domainInput = dataModel.getDomain(series, 'xValue', domainKey, processedData);
    const xValues =
        domainKey === 'key'
            ? dataModel.resolveKeysById(series, 'xValue', processedData)
            : dataModel.resolveColumnById(series, 'xValue', processedData);
    const xNeedsValueOf =
        domainKey === 'key' ? false : dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);

    const [d0, d1] = aggregationDomain(xAxis.scale.type, domainInput);

    // Filters are sorted ascending by maxRange — the last entry is the finest
    // level (most buckets). Recompute that from the raw selection bitset, then
    // propagate up the pyramid into coarser levels.
    const finest = filters.at(-1)!;
    computeBucketSelection(selection, finest.indexData, finest.maxRange, xValues, d0, d1, xNeedsValueOf);

    for (let i = filters.length - 2; i >= 0; i--) {
        propagateBucketSelection(filters[i].indexData, filters[i + 1].indexData, filters[i].maxRange);
    }
}
