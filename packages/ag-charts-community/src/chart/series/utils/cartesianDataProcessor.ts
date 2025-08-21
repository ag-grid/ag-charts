import { isDefined } from 'ag-charts-core';

import { extent } from '../../../util/extent';
import { simpleMemorize2 } from '../../../util/memo';
import { LogAxis } from '../../axis/logAxis';
import { NumberAxis } from '../../axis/numberAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import {
    type DataModel,
    type DataModelOptions,
    type DatumPropertyDefinition,
    type ProcessedData,
    fixNumericExtent,
} from '../../data/dataModel';
import {
    animationValidation,
    diff,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    processedDataIsAnimatable,
    valueProperty,
} from '../../data/processors';
import { type LineSeriesDataAggregationFilter, aggregateLineData } from '../cartesian/lineAggregation';
import type { CartesianDataProcessor, CartesianSeriesDataContext, CartesianSeriesDataProperties } from './interfaces';

const memoizedAggregateLineData = simpleMemorize2(aggregateLineData);

/**
 * CartesianDataProcessor implementation for processing Cartesian series data
 * Handles stacking, normalization, and aggregation logic shared across Line/Area/Bar series
 */
export class CartesianDataProcessorImpl implements CartesianDataProcessor {
    private dataAggregationFilters: LineSeriesDataAggregationFilter[] | undefined = undefined;

    async processData(
        context: CartesianSeriesDataContext,
        properties: CartesianSeriesDataProperties,
        dataController: DataController
    ): Promise<void> {
        if (context.data == null) return;

        const { data, visible, seriesGrouping: { groupIndex = context.id, stackCount = 0 } = {} } = context;
        const { xKey, yKey, yFilterKey, connectMissingData, normalizedTo } = properties;
        const animationEnabled = !this.isAnimationSkipped(context);

        const xScale = context.axes[ChartAxisDirection.X]?.scale;
        const yScale = context.axes[ChartAxisDirection.Y]?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const stacked = stackCount > 1 || normalizedTo != null;

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if (connectMissingData && stacked) {
            common.invalidValue = 0;
        }
        if (stacked && !visible) {
            common.forceValue = 0;
        }

        const idMap = {
            value: `area-stack-${groupIndex}-yValue`,
            marker: `area-stack-${groupIndex}-yValues-marker`,
        };

        const props: DataModelOptions<any, false, false>['props'] = [];

        // If two or more datum share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datum and
        // automatically garbage collect the marker selection.
        if (!isContinuousX || stacked) {
            props.push(keyProperty(xKey, xScaleType, { id: 'xKey' }));
        }

        props.push(
            valueProperty(xKey, xScaleType, { id: 'xValue' }),
            valueProperty(yKey, yScaleType, {
                id: `yValueRaw`,
                ...common,
                invalidValue: undefined,
            })
        );

        if (yFilterKey != null) {
            props.push(valueProperty(yFilterKey, yScaleType, { id: 'yFilterRaw' }));
        }

        if (stacked) {
            props.push(
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    'current',
                    { id: `yValueCumulative`, ...common, groupId: idMap.marker },
                    yScaleType
                )
            );
        }

        if (isDefined(normalizedTo)) {
            props.push(
                valueProperty(yKey, yScaleType, { id: `yValue`, ...common, groupId: idMap.value }),
                normaliseGroupTo(Object.values(idMap), normalizedTo)
            );
        }

        if (animationEnabled) {
            props.push(animationValidation(isContinuousX ? ['xValue'] : undefined));
            if (context.processedData) {
                props.push(diff(context.id, context.processedData));
            }
        }

        const { dataModel, processedData } = await context.requestDataModel(dataController, data, {
            props,
            groupByKeys: stacked,
            groupByData: !stacked,
        });

        // Store results in context
        context.dataModel = dataModel;
        context.processedData = processedData;

        this.dataAggregationFilters = this.aggregateData(dataModel, processedData, context);

        context.animationState.transition('updateData');
    }

    private isAnimationSkipped(_context: CartesianSeriesDataContext): boolean {
        // This would need access to context.ctx.animationManager.isSkipped() in real implementation
        // For now, assume false as a safe default
        return false;
    }

    private getScaleInformation({ xScale, yScale }: { xScale?: any; yScale?: any }) {
        // Extract scale information logic from LineSeries
        const isContinuousX = xScale?.type !== 'band' && xScale?.type !== 'ordinal';
        const xScaleType = xScale?.type ?? 'linear';
        const yScaleType = yScale?.type ?? 'linear';

        return { isContinuousX, xScaleType, yScaleType };
    }

    private aggregateData(
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        context: CartesianSeriesDataContext
    ): LineSeriesDataAggregationFilter[] | undefined {
        if (processedData.type !== 'ungrouped') return;
        if (this.isProcessedDataAnimatable(processedData)) return;

        const xAxis = context.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const { scale } = xAxis;
        const xValues = dataModel.resolveColumnById(context, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(context, this.yCumulativeKey(processedData), processedData);
        const domain = dataModel.getDomain(context, `xValue`, 'value', processedData);

        return memoizedAggregateLineData(scale.type, xValues, yValues, domain);
    }

    private isProcessedDataAnimatable(processedData: ProcessedData<any>): boolean {
        return processedDataIsAnimatable(processedData);
    }

    private yCumulativeKey(processedData: ProcessedData<any>): string {
        return processedData.type === 'grouped' ? 'yValueCumulative' : 'yValueRaw';
    }

    public getDataAggregationFilters(): LineSeriesDataAggregationFilter[] | undefined {
        return this.dataAggregationFilters;
    }

    /**
     * Calculate series domain for a given direction
     */
    getSeriesDomain(
        context: CartesianSeriesDataContext,
        direction: ChartAxisDirection,
        isNormalized: boolean = false
    ): any[] {
        const { dataModel, processedData } = context;
        if (!dataModel || !processedData) return [];

        if (direction === ChartAxisDirection.X) {
            return this.getXDomain(context, dataModel, processedData);
        }

        return this.getYDomain(context, dataModel, processedData, isNormalized);
    }

    /**
     * Get X domain for series
     */
    private getXDomain(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>
    ): any[] {
        const xDef = dataModel.resolveProcessedDataDefById(context, 'xValue');
        const domain = dataModel.getDomain(context, 'xValue', 'value', processedData);

        if (xDef?.def.type === 'value' && xDef.def.valueType === 'category') {
            return domain;
        }

        return fixNumericExtent(extent(domain));
    }

    /**
     * Get Y domain for series with stacking and normalization support
     */
    private getYDomain(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        isNormalized: boolean
    ): any[] {
        const yExtent = this.domainForClippedRange(
            context,
            dataModel,
            processedData,
            ChartAxisDirection.Y,
            [this.yCumulativeKey(processedData)],
            'xValue'
        );

        if (isNormalized) {
            const yAxis = context.axes[ChartAxisDirection.Y];
            if (yAxis instanceof NumberAxis && !(yAxis instanceof LogAxis)) {
                const fixedYExtent = Number.isFinite(yExtent[1] - yExtent[0])
                    ? [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]]
                    : [];
                return fixNumericExtent(fixedYExtent);
            }
        }

        return fixNumericExtent(yExtent);
    }

    /**
     * Get series range for visible domain
     */
    getSeriesRange(
        context: CartesianSeriesDataContext,
        direction: ChartAxisDirection,
        visibleRange: [any, any]
    ): number[] {
        const { dataModel, processedData } = context;
        if (!dataModel || !processedData) return [];

        return this.domainForVisibleRange(
            context,
            dataModel,
            processedData,
            ChartAxisDirection.Y,
            [this.yCumulativeKey(processedData)],
            'xValue',
            visibleRange
        );
    }

    /**
     * Calculate domain for clipped range
     */
    private domainForClippedRange(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        direction: ChartAxisDirection,
        columnIds: string[],
        categoryKey: string
    ): [number, number] {
        const axis = context.axes[direction];
        if (!axis) return [0, 0];

        let domain = [Infinity, -Infinity] as [number, number];

        for (const columnId of columnIds) {
            const values = dataModel.resolveColumnById(context, columnId, processedData);
            for (const value of values) {
                if (typeof value === 'number' && isFinite(value)) {
                    domain[0] = Math.min(domain[0], value);
                    domain[1] = Math.max(domain[1], value);
                }
            }
        }

        return domain[0] === Infinity ? [0, 0] : domain;
    }

    /**
     * Calculate domain for visible range
     */
    private domainForVisibleRange(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        direction: ChartAxisDirection,
        columnIds: string[],
        categoryKey: string,
        visibleRange: [any, any]
    ): number[] {
        const axis = context.axes[direction];
        if (!axis) return [];

        const xValues = dataModel.resolveColumnById(context, categoryKey, processedData);
        const startIdx = xValues.findIndex((x) => x >= visibleRange[0]);
        const endIdx = xValues.findIndex((x) => x > visibleRange[1]);

        const start = startIdx >= 0 ? startIdx : 0;
        const end = endIdx >= 0 ? endIdx : xValues.length;

        let range = [Infinity, -Infinity];
        for (const columnId of columnIds) {
            const values = dataModel.resolveColumnById(context, columnId, processedData);
            for (let i = start; i < end; i++) {
                const value = values[i];
                if (typeof value === 'number' && isFinite(value)) {
                    range[0] = Math.min(range[0], value);
                    range[1] = Math.max(range[1], value);
                }
            }
        }

        return range[0] === Infinity ? [] : range;
    }

    /**
     * Handle stacking for multiple series
     */
    processStackedData(contexts: CartesianSeriesDataContext[], stackId: string, normalizedTo?: number): void {
        if (contexts.length <= 1) return;

        // Group contexts by their x values to handle stacking
        const stackGroups = new Map<any, CartesianSeriesDataContext[]>();

        for (const context of contexts) {
            if (!context.dataModel || !context.processedData) continue;

            const xValues = context.dataModel.resolveColumnById(context, 'xValue', context.processedData);
            for (let i = 0; i < xValues.length; i++) {
                const xValue = xValues[i];
                if (!stackGroups.has(xValue)) {
                    stackGroups.set(xValue, []);
                }
                stackGroups.get(xValue)!.push(context);
            }
        }

        // Process stacked values
        for (const [xValue, groupContexts] of stackGroups) {
            this.calculateStackedValues(groupContexts, xValue, normalizedTo);
        }
    }

    /**
     * Calculate stacked values for a group of series at a specific x value
     */
    private calculateStackedValues(contexts: CartesianSeriesDataContext[], xValue: any, normalizedTo?: number): void {
        let positiveSum = 0;
        let negativeSum = 0;

        // First pass: calculate totals
        const values: { context: CartesianSeriesDataContext; value: number; index: number }[] = [];

        for (const context of contexts) {
            if (!context.dataModel || !context.processedData) continue;

            const xValues = context.dataModel.resolveColumnById(context, 'xValue', context.processedData);
            const yValues = context.dataModel.resolveColumnById(context, 'yValueRaw', context.processedData);

            const index = xValues.indexOf(xValue);
            if (index >= 0 && index < yValues.length) {
                const value = yValues[index];
                if (typeof value === 'number' && isFinite(value)) {
                    values.push({ context, value, index });
                    if (value >= 0) {
                        positiveSum += value;
                    } else {
                        negativeSum += value;
                    }
                }
            }
        }

        // Second pass: calculate cumulative values
        let positiveStack = 0;
        let negativeStack = 0;

        for (const { context, value, index } of values) {
            if (!context.dataModel || !context.processedData) continue;

            let cumulativeValue: number;
            if (value >= 0) {
                cumulativeValue = positiveStack + value;
                positiveStack = cumulativeValue;
            } else {
                cumulativeValue = negativeStack + value;
                negativeStack = cumulativeValue;
            }

            // Apply normalization if specified
            if (normalizedTo != null) {
                const total = value >= 0 ? positiveSum : Math.abs(negativeSum);
                if (total > 0) {
                    cumulativeValue = (cumulativeValue / total) * normalizedTo;
                }
            }

            // Update the cumulative value in the data model
            // This would require modifying the data model structure
            // For now, store in a separate structure
        }
    }

    /**
     * Calculate visible range indices for optimization
     */
    visibleRangeIndices(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        columnId: string,
        axisRange: [number, number],
        indices?: number[]
    ): [number, number] {
        const values = dataModel.resolveColumnById(context, columnId, processedData);

        if (indices) {
            // Use indices for aggregated data
            let start = 0;
            let end = indices.length;

            for (let i = 0; i < indices.length; i++) {
                if (values[indices[i]] >= axisRange[0]) {
                    start = i;
                    break;
                }
            }

            for (let i = indices.length - 1; i >= 0; i--) {
                if (values[indices[i]] <= axisRange[1]) {
                    end = i + 1;
                    break;
                }
            }

            return [start, end];
        } else {
            // Direct value search
            let start = 0;
            let end = values.length;

            for (let i = 0; i < values.length; i++) {
                if (values[i] >= axisRange[0]) {
                    start = i;
                    break;
                }
            }

            for (let i = values.length - 1; i >= 0; i--) {
                if (values[i] <= axisRange[1]) {
                    end = i + 1;
                    break;
                }
            }

            return [start, end];
        }
    }
}
