import { _ModuleSupport } from 'ag-charts-community';
import type { ExtremesAggregationFilter, ExtremesPartialAggregationResult, ScaleType } from 'ag-charts-core';
import {
    computeExtremesAggregation,
    computeExtremesAggregationPartial,
    epochColumnForTimeScale,
    narrowAggregationX,
    narrowBigIntColumnRelative,
    simpleMemorize2,
} from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

type ScopeProvider = _ModuleSupport.ScopeProvider;
type ProcessedData = _ModuleSupport.ProcessedData<any>;
type DataModel = _ModuleSupport.DataModel<any, any, any>;

export type RangeBarSeriesDataAggregationFilter = ExtremesAggregationFilter;
export type RangeBarPartialAggregationResult = ExtremesPartialAggregationResult;

function aggregateRangeBarData(
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    d0: number,
    d1: number,
    smallestKeyInterval: AgNumericValue | undefined,
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): RangeBarSeriesDataAggregationFilter[] | undefined {
    return computeExtremesAggregation([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf,
    });
}

const memoizedAggregateRangeBarData = simpleMemorize2(aggregateRangeBarData);

export function aggregateRangeBarDataFromDataModel(
    scale: ScaleType,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: ScopeProvider,
    existingFilters?: RangeBarSeriesDataAggregationFilter[]
): RangeBarSeriesDataAggregationFilter[] | undefined {
    const rawXValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const rawHighValues = dataModel.resolveColumnById(series, 'yHighValue', processedData, 'mixed-numeric');
    const rawLowValues = dataModel.resolveColumnById(series, 'yLowValue', processedData, 'mixed-numeric');

    const domainInput = dataModel.getDomain(series, 'xValue', 'key', processedData);

    const rawXNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'yHighValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'yLowValue', processedData);

    const { values: epochXValues, needsValueOf: xNeedsValueOf } = epochColumnForTimeScale(
        scale,
        rawXValues,
        rawXNeedsValueOf
    );
    // Subtract the bigint domain-min from x and [d0,d1] together so a high-magnitude narrow-range x keeps full
    // bucketing precision; falls back to an absolute narrow + aggregationDomain for non-bigint columns.
    const { xValues, domain } = narrowAggregationX(scale, epochXValues, domainInput);
    const highValues = yNeedsValueOf ? rawHighValues : narrowBigIntColumnRelative(rawHighValues);
    const lowValues = yNeedsValueOf ? rawLowValues : narrowBigIntColumnRelative(rawLowValues);

    // When existingFilters provided, bypass memoization to enable array reuse
    if (existingFilters) {
        return computeExtremesAggregation(domain, xValues, highValues, lowValues, {
            smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
            xNeedsValueOf,
            yNeedsValueOf,
            existingFilters,
        });
    }

    return memoizedAggregateRangeBarData(
        xValues,
        highValues,
        lowValues,
        domain[0],
        domain[1],
        processedData.reduced?.smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf
    );
}

export function aggregateRangeBarDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: ScopeProvider,
    targetRange: number,
    existingFilters?: RangeBarSeriesDataAggregationFilter[]
): RangeBarPartialAggregationResult | undefined {
    const rawXValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const rawHighValues = dataModel.resolveColumnById(series, 'yHighValue', processedData, 'mixed-numeric');
    const rawLowValues = dataModel.resolveColumnById(series, 'yLowValue', processedData, 'mixed-numeric');

    const domainInput = dataModel.getDomain(series, 'xValue', 'key', processedData);

    const rawXNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'yHighValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'yLowValue', processedData);

    const { values: epochXValues, needsValueOf: xNeedsValueOf } = epochColumnForTimeScale(
        scale,
        rawXValues,
        rawXNeedsValueOf
    );
    // Subtract the bigint domain-min from x and [d0,d1] together so a high-magnitude narrow-range x keeps full
    // bucketing precision; falls back to an absolute narrow + aggregationDomain for non-bigint columns.
    const { xValues, domain } = narrowAggregationX(scale, epochXValues, domainInput);
    const highValues = yNeedsValueOf ? rawHighValues : narrowBigIntColumnRelative(rawHighValues);
    const lowValues = yNeedsValueOf ? rawLowValues : narrowBigIntColumnRelative(rawLowValues);

    return computeExtremesAggregationPartial(domain, xValues, highValues, lowValues, {
        smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
        targetRange,
        xNeedsValueOf,
        yNeedsValueOf,
        existingFilters,
    });
}
