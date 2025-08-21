import { extent } from '../../../util/extent';
import { LogAxis } from '../../axis/logAxis';
import { NumberAxis } from '../../axis/numberAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import type { CartesianSeriesDataContext } from './interfaces';

/**
 * Domain and range calculation utilities for Cartesian series
 */

export interface DomainCalculationOptions {
    includeZero?: boolean;
    padding?: number;
    stackCount?: number;
    normalizedTo?: number;
    connectMissingData?: boolean;
}

/**
 * Cartesian domain calculation manager
 */
export class CartesianDomainManager {
    /**
     * Calculate series domain for a given direction
     */
    static getSeriesDomain(
        context: CartesianSeriesDataContext,
        direction: ChartAxisDirection,
        options: DomainCalculationOptions = {}
    ): any[] {
        const { dataModel, processedData } = context;
        if (!dataModel || !processedData) return [];

        if (direction === ChartAxisDirection.X) {
            return this.getXDomain(context, dataModel, processedData, options);
        }

        return this.getYDomain(context, dataModel, processedData, options);
    }

    /**
     * Calculate X domain
     */
    private static getXDomain(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        options: DomainCalculationOptions
    ): any[] {
        const xDef = dataModel.resolveProcessedDataDefById(context, 'xValue');
        const domain = dataModel.getDomain(context, 'xValue', 'value', processedData);

        if (xDef?.def.type === 'value' && xDef.def.valueType === 'category') {
            return domain;
        }

        const numericExtent = fixNumericExtent(extent(domain));

        if (options.padding) {
            const range = numericExtent[1] - numericExtent[0];
            const padding = range * options.padding;
            return [numericExtent[0] - padding, numericExtent[1] + padding];
        }

        return numericExtent;
    }

    /**
     * Calculate Y domain with stacking and normalization support
     */
    private static getYDomain(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        options: DomainCalculationOptions
    ): any[] {
        const yCumulativeKey = processedData.type === 'grouped' ? 'yValueCumulative' : 'yValueRaw';

        const yExtent = this.calculateDomainForColumns(context, dataModel, processedData, [yCumulativeKey]);

        if (options.normalizedTo != null) {
            return this.applyNormalization(context, yExtent, options.normalizedTo);
        }

        if (options.includeZero) {
            yExtent[0] = Math.min(yExtent[0], 0);
            yExtent[1] = Math.max(yExtent[1], 0);
        }

        return fixNumericExtent(yExtent);
    }

    /**
     * Apply normalization to domain
     */
    private static applyNormalization(
        context: CartesianSeriesDataContext,
        extent: [number, number],
        normalizedTo: number
    ): any[] {
        const yAxis = context.axes[ChartAxisDirection.Y];

        if (yAxis instanceof NumberAxis && !(yAxis instanceof LogAxis)) {
            const fixedYExtent = Number.isFinite(extent[1] - extent[0])
                ? [extent[0] > 0 ? 0 : extent[0], extent[1] < 0 ? 0 : extent[1]]
                : [];
            return fixNumericExtent(fixedYExtent);
        }

        return fixNumericExtent(extent);
    }

    /**
     * Calculate domain for multiple columns
     */
    private static calculateDomainForColumns(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        columnIds: string[]
    ): [number, number] {
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
     * Calculate series range for visible area
     */
    static getSeriesRange(
        context: CartesianSeriesDataContext,
        direction: ChartAxisDirection,
        visibleRange: [any, any],
        options: DomainCalculationOptions = {}
    ): number[] {
        const { dataModel, processedData } = context;
        if (!dataModel || !processedData) return [];

        const yCumulativeKey = processedData.type === 'grouped' ? 'yValueCumulative' : 'yValueRaw';

        return this.calculateVisibleRange(context, dataModel, processedData, [yCumulativeKey], visibleRange);
    }

    /**
     * Calculate range for visible area
     */
    private static calculateVisibleRange(
        context: CartesianSeriesDataContext,
        dataModel: DataModel<any, any>,
        processedData: ProcessedData<any>,
        columnIds: string[],
        visibleRange: [any, any]
    ): number[] {
        const xValues = dataModel.resolveColumnById(context, 'xValue', processedData);

        // Find visible data indices
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
     * Calculate zoom fitting range
     */
    static getZoomRangeFittingItems(
        context: CartesianSeriesDataContext,
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): { x: [number, number]; y: [number, number] | undefined } | undefined {
        const { dataModel, processedData } = context;
        if (!dataModel || !processedData) return;

        const yCumulativeKey = processedData.type === 'grouped' ? 'yValueCumulative' : 'yValueRaw';

        const xValues = dataModel.resolveColumnById(context, 'xValue', processedData);
        const yValues = dataModel.resolveColumnById(context, yCumulativeKey, processedData);

        // Find items that would be visible in the given ranges
        let visibleCount = 0;
        let xMin = Infinity,
            xMax = -Infinity;
        let yMin = Infinity,
            yMax = -Infinity;

        for (let i = 0; i < xValues.length; i++) {
            const xValue = xValues[i];
            const yValue = yValues[i];

            if (
                xValue >= xVisibleRange[0] &&
                xValue <= xVisibleRange[1] &&
                (!yVisibleRange || (yValue >= yVisibleRange[0] && yValue <= yVisibleRange[1]))
            ) {
                visibleCount++;
                xMin = Math.min(xMin, xValue);
                xMax = Math.max(xMax, xValue);
                yMin = Math.min(yMin, yValue);
                yMax = Math.max(yMax, yValue);
            }
        }

        if (visibleCount < minVisibleItems) return;

        return {
            x: [xMin, xMax],
            y: yVisibleRange && yMin !== Infinity ? [yMin, yMax] : undefined,
        };
    }

    /**
     * Count visible items in range
     */
    static getVisibleItems(
        context: CartesianSeriesDataContext,
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        const { dataModel, processedData } = context;
        if (!dataModel || !processedData) return 0;

        const yCumulativeKey = processedData.type === 'grouped' ? 'yValueCumulative' : 'yValueRaw';

        const xValues = dataModel.resolveColumnById(context, 'xValue', processedData);
        const yValues = dataModel.resolveColumnById(context, yCumulativeKey, processedData);

        let count = 0;

        for (let i = 0; i < xValues.length; i++) {
            const xValue = xValues[i];
            const yValue = yValues[i];

            if (
                xValue >= xVisibleRange[0] &&
                xValue <= xVisibleRange[1] &&
                (!yVisibleRange || (yValue >= yVisibleRange[0] && yValue <= yVisibleRange[1]))
            ) {
                count++;
            }
        }

        return count;
    }
}

/**
 * Coordinate range utilities
 */
export class CartesianCoordinateRangeManager {
    /**
     * Calculate coordinate range for X values
     */
    static xCoordinateRange(xValue: any, xScale: any, markerSize: number, pixelSize: number = 1): [number, number] {
        const x = xScale.convert(xValue);
        const radius = markerSize > 0 ? 0.5 * markerSize * pixelSize : 0;
        return [x - radius, x + radius];
    }

    /**
     * Calculate coordinate range for Y values
     */
    static yCoordinateRange(yValues: any[], yScale: any, markerSize: number, pixelSize: number = 1): [number, number] {
        const y = yScale.convert(yValues[0]);
        const radius = markerSize > 0 ? 0.5 * markerSize * pixelSize : 0;
        return [y - radius, y + radius];
    }

    /**
     * Calculate visible range indices for optimization
     */
    static visibleRangeIndices(
        context: CartesianSeriesDataContext,
        columnId: string,
        axisRange: [number, number],
        indices?: number[]
    ): [number, number] {
        const { dataModel, processedData } = context;
        if (!dataModel || !processedData) return [0, 0];

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

/**
 * Stacking domain utilities
 */
export class CartesianStackingDomainManager {
    /**
     * Calculate stacked domain across multiple series
     */
    static calculateStackedDomain(contexts: CartesianSeriesDataContext[], direction: ChartAxisDirection): any[] {
        if (contexts.length === 0) return [];
        if (contexts.length === 1) {
            return CartesianDomainManager.getSeriesDomain(contexts[0], direction);
        }

        // For stacked series, we need to calculate cumulative values
        const combinedDomain = [Infinity, -Infinity];

        for (const context of contexts) {
            const domain = CartesianDomainManager.getSeriesDomain(context, direction);
            if (domain.length === 2) {
                combinedDomain[0] = Math.min(combinedDomain[0], domain[0]);
                combinedDomain[1] = Math.max(combinedDomain[1], domain[1]);
            }
        }

        return combinedDomain[0] === Infinity ? [] : combinedDomain;
    }

    /**
     * Calculate normalized stacked domain
     */
    static calculateNormalizedStackedDomain(contexts: CartesianSeriesDataContext[], normalizedTo: number): any[] {
        // For normalized stacking, the domain is typically [0, normalizedTo]
        return [0, normalizedTo];
    }
}
