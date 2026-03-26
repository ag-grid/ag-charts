import { _ModuleSupport } from 'ag-charts-community';
import type {
    DomainWithMetadata,
    ExtremesAggregationFilter,
    ExtremesPartialAggregationResult,
    ScaleType,
} from 'ag-charts-core';
import {
    aggregationDomain,
    computeExtremesAggregation,
    computeExtremesAggregationPartial,
    simpleMemorize2,
} from 'ag-charts-core';

type ScopeProvider = _ModuleSupport.ScopeProvider;
type ProcessedData = _ModuleSupport.ProcessedData<any>;
type DataModel = _ModuleSupport.DataModel<any, any, any>;

// Type aliases for RangeBar-specific usage
export type RangeBarSeriesDataAggregationFilter = ExtremesAggregationFilter;
export type RangeBarPartialAggregationResult = ExtremesPartialAggregationResult;

// ============================================================================
// ADAPTER LAYER: Scale integration
// ============================================================================

function aggregateRangeBarData(
    scale: ScaleType,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domainInput: DomainWithMetadata<number>,
    smallestKeyInterval: number | undefined,
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): RangeBarSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domainInput);
    return computeExtremesAggregation([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf,
    });
}

// ============================================================================
// INTEGRATION LAYER: Memoization and DataModel integration
// ============================================================================

const memoizedAggregateRangeBarData = simpleMemorize2(aggregateRangeBarData);

export function aggregateRangeBarDataFromDataModel(
    scale: ScaleType,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: ScopeProvider,
    existingFilters?: RangeBarSeriesDataAggregationFilter[]
): RangeBarSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, 'yHighValue', processedData);
    const lowValues = dataModel.resolveColumnById(series, 'yLowValue', processedData);

    const domainInput = dataModel.getDomain(series, 'xValue', 'key', processedData);

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'yHighValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'yLowValue', processedData);

    // When existingFilters provided, bypass memoization to enable array reuse
    if (existingFilters) {
        const [d0, d1] = aggregationDomain(scale, domainInput);
        return computeExtremesAggregation([d0, d1], xValues, highValues, lowValues, {
            smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
            xNeedsValueOf,
            yNeedsValueOf,
            existingFilters,
        });
    }

    return memoizedAggregateRangeBarData(
        scale,
        xValues,
        highValues,
        lowValues,
        domainInput,
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
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, 'yHighValue', processedData);
    const lowValues = dataModel.resolveColumnById(series, 'yLowValue', processedData);

    const domainInput = dataModel.getDomain(series, 'xValue', 'key', processedData);

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'yHighValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'yLowValue', processedData);

    const [d0, d1] = aggregationDomain(scale, domainInput);
    return computeExtremesAggregationPartial([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
        targetRange,
        xNeedsValueOf,
        yNeedsValueOf,
        existingFilters,
    });
}
