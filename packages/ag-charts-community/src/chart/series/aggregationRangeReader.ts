import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    aggregationBucketForDatum,
    aggregationDomain,
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
