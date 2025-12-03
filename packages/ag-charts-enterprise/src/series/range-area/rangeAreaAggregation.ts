import { _ModuleSupport } from 'ag-charts-community';
import type { DomainWithMetadata, ScaleType } from 'ag-charts-core';
import { simpleMemorize2 } from 'ag-charts-core';

const {
    AGGREGATION_SPAN,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    aggregationDomain,
    computeExtremesAggregation,
    computeExtremesAggregationPartial,
} = _ModuleSupport;

type ScopeProvider = _ModuleSupport.ScopeProvider;
type ProcessedData = _ModuleSupport.ProcessedData<any>;
type DataModel = _ModuleSupport.DataModel<any, any, any>;

// Type aliases for RangeArea-specific usage
export type RangeAreaSeriesDataAggregationFilter = _ModuleSupport.ExtremesAggregationFilter;
export type RangeAreaPartialAggregationResult = _ModuleSupport.ExtremesPartialAggregationResult;

// Semantic constants for Range Area data access
export const START = AGGREGATION_INDEX_X_MIN;
export const HIGH = AGGREGATION_INDEX_Y_MAX;
export const LOW = AGGREGATION_INDEX_Y_MIN;
export const END = AGGREGATION_INDEX_X_MAX;
export const SPAN = AGGREGATION_SPAN;

// ============================================================================
// ADAPTER LAYER: Scale integration
// ============================================================================

function aggregateRangeAreaData(
    scale: ScaleType,
    xValues: any[],
    highValues: any[],
    lowValues: any[],
    domainInput: DomainWithMetadata<number>,
    smallestKeyInterval: number | undefined,
    xNeedsValueOf: boolean,
    yNeedsValueOf: boolean
): RangeAreaSeriesDataAggregationFilter[] | undefined {
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

const memoizedAggregateRangeAreaData = simpleMemorize2(aggregateRangeAreaData);

export function aggregateRangeAreaDataFromDataModel(
    scale: ScaleType,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: ScopeProvider,
    existingFilters?: RangeAreaSeriesDataAggregationFilter[]
): RangeAreaSeriesDataAggregationFilter[] | undefined {
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

    return memoizedAggregateRangeAreaData(
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

export function aggregateRangeAreaDataFromDataModelPartial(
    scale: ScaleType,
    dataModel: DataModel,
    processedData: ProcessedData,
    series: ScopeProvider,
    targetRange: number,
    existingFilters?: RangeAreaSeriesDataAggregationFilter[]
): RangeAreaPartialAggregationResult | undefined {
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
