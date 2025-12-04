import { _ModuleSupport } from 'ag-charts-community';
import type { ExtremesAggregationFilter, ExtremesPartialAggregationResult, ScaleType } from 'ag-charts-core';
import {
    aggregationDomain,
    computeExtremesAggregation,
    computeExtremesAggregationPartial,
    simpleMemorize2,
} from 'ag-charts-core';

type ScopeProvider = _ModuleSupport.ScopeProvider;
type ProcessedData = _ModuleSupport.ProcessedData<any>;
type DataModel = _ModuleSupport.DataModel<any, any, any>;

// Type aliases for OHLC-specific usage
export type OhlcSeriesDataAggregationFilter = ExtremesAggregationFilter;
export type OhlcPartialAggregationResult = ExtremesPartialAggregationResult;

// ============================================================================
// ADAPTER LAYER: Scale integration
// ============================================================================

function aggregateOhlcData(
    scale: ScaleType,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domain: number[],
    smallestKeyInterval: number | undefined,
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): OhlcSeriesDataAggregationFilter[] | undefined {
    const [d0, d1] = aggregationDomain(scale, domain);
    return computeExtremesAggregation([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf,
    });
}

// ============================================================================
// INTEGRATION LAYER: Memoization and DataModel integration
// ============================================================================

const memoizedAggregateOhlcData = simpleMemorize2(aggregateOhlcData);

export function aggregateOhlcDataFromDataModel(
    scale: ScaleType,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: ScopeProvider,
    existingFilters?: OhlcSeriesDataAggregationFilter[]
): OhlcSeriesDataAggregationFilter[] | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, 'highValue', processedData);
    const lowValues = dataModel.resolveColumnById(series, 'lowValue', processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'highValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'lowValue', processedData);

    // When existingFilters provided, bypass memoization to enable array reuse
    if (existingFilters) {
        const [d0, d1] = aggregationDomain(scale, domain);
        return computeExtremesAggregation([d0, d1], xValues, highValues, lowValues, {
            smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
            xNeedsValueOf,
            yNeedsValueOf,
            existingFilters,
        });
    }

    return memoizedAggregateOhlcData(
        scale,
        xValues,
        highValues,
        lowValues,
        domain,
        processedData.reduced?.smallestKeyInterval,
        xNeedsValueOf,
        yNeedsValueOf
    );
}

export function aggregateOhlcDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: ScopeProvider,
    targetRange: number,
    existingFilters?: OhlcSeriesDataAggregationFilter[]
): OhlcPartialAggregationResult | undefined {
    const xValues = dataModel.resolveKeysById(series, 'xValue', processedData);
    const highValues = dataModel.resolveColumnById(series, 'highValue', processedData);
    const lowValues = dataModel.resolveColumnById(series, 'lowValue', processedData);

    const { index } = dataModel.resolveProcessedDataDefById(series, 'xValue');
    const domain = processedData.domain.keys[index];

    const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(series, 'xValue', processedData);
    const yNeedsValueOf =
        dataModel.resolveColumnNeedsValueOf(series, 'highValue', processedData) ??
        dataModel.resolveColumnNeedsValueOf(series, 'lowValue', processedData);

    const [d0, d1] = aggregationDomain(scale, domain);
    return computeExtremesAggregationPartial([d0, d1], xValues, highValues, lowValues, {
        smallestKeyInterval: processedData.reduced?.smallestKeyInterval,
        targetRange,
        xNeedsValueOf,
        yNeedsValueOf,
        existingFilters,
    });
}
