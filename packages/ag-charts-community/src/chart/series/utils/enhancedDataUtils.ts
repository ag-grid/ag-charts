import { Logger } from 'ag-charts-core';

import { LinearScale } from '../../../scale/linearScale';
import { toRadians } from '../../../util/angle';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModel, ProcessedData, getMissCount } from '../../data/dataModel';
import {
    accumulativeValueProperty,
    animationValidation,
    createDatumId,
    diff,
    keyProperty,
    normalisePropertyTo,
    rangedValueProperty,
    valueProperty,
} from '../../data/processors';
import type { DataModelSeriesNodeDatum } from '../dataModelSeries';
import type { NodeDataResult, ProcessedDataValues, SeriesDataContext, SeriesDataProperties } from './interfaces';

/**
 * Data validation context
 */
export interface DataValidationContext {
    id: string;
    processedData?: { defs?: { values?: Array<{ id: string; missing: any; property: any }> } };
}

/**
 * Scale management interface
 */
export interface ScaleManager {
    angleScale: LinearScale;
    radiusScale: LinearScale;
    getSeriesDomain(direction: ChartAxisDirection): any[];
}

/**
 * Enhanced data processor for polar series with comprehensive patterns
 */
export class EnhancedPolarDataProcessor<TDatum extends DataModelSeriesNodeDatum = DataModelSeriesNodeDatum> {
    constructor(
        private readonly series: SeriesDataContext & {
            properties: SeriesDataProperties;
            requestDataModel(dataController: DataController): Promise<any>;
        },
        private readonly scaleManager: ScaleManager
    ) {}

    /**
     * Complete data processing pipeline with all patterns from DonutSeries
     */
    async processData(dataController: DataController): Promise<void> {
        if (this.series.data == null) return;

        const {
            visible,
            id: seriesId,
            ctx: { legendManager },
        } = this.series;
        const { angleKey, angleFilterKey, radiusKey, calloutLabelKey, sectorLabelKey, legendItemKey } =
            this.series.properties;

        const processor = () => (value: unknown, index: number) => {
            if (visible && legendManager.getItemEnabled({ seriesId, itemId: index })) {
                return value;
            }
            return 0;
        };

        const animationEnabled = !this.series.ctx.animationManager.isSkipped();
        const extraKeyProps = [];
        const extraProps = [];

        // Build data processing pipeline
        this.buildKeyProperties(extraKeyProps, { legendItemKey, calloutLabelKey, sectorLabelKey });
        this.buildValueProperties(extraProps, processor, {
            radiusKey,
            calloutLabelKey,
            sectorLabelKey,
            legendItemKey,
            angleFilterKey,
        });

        // Handle animation validation
        if (animationEnabled && this.hasAnimationValidation()) {
            extraProps.push(diff(this.series.id, this.series.processedData));
        }
        extraProps.push(animationValidation());

        // Request data model
        await this.series.requestDataModel(dataController, this.series.data, {
            props: [
                ...extraKeyProps,
                accumulativeValueProperty(angleKey, this.scaleManager.angleScale.type, {
                    id: `angleValue`,
                    onlyPositive: true,
                    invalidValue: 0,
                    processor,
                }),
                valueProperty(angleKey, this.scaleManager.angleScale.type, { id: `angleRaw` }),
                normalisePropertyTo('angleValue', [0, 1], 0, 0),
                ...extraProps,
            ],
        });

        // Validate data and log warnings
        this.validateAndLogMissingData();

        this.series.animationState.transition('updateData');
    }

    /**
     * Build key properties for data processing
     */
    private buildKeyProperties(
        extraKeyProps: any[],
        keys: { legendItemKey?: string; calloutLabelKey?: string; sectorLabelKey?: string }
    ): void {
        const { legendItemKey, calloutLabelKey, sectorLabelKey } = keys;

        if (legendItemKey) {
            extraKeyProps.push(keyProperty(legendItemKey, 'category', { id: `legendItemKey` }));
        } else if (calloutLabelKey) {
            extraKeyProps.push(keyProperty(calloutLabelKey, 'category', { id: `calloutLabelKey` }));
        } else if (sectorLabelKey) {
            extraKeyProps.push(keyProperty(sectorLabelKey, 'category', { id: `sectorLabelKey` }));
        }
    }

    /**
     * Build value properties for data processing
     */
    private buildValueProperties(
        extraProps: any[],
        processor: () => (value: unknown, index: number) => unknown,
        properties: {
            radiusKey?: string;
            calloutLabelKey?: string;
            sectorLabelKey?: string;
            legendItemKey?: string;
            angleFilterKey?: string;
        }
    ): void {
        const { radiusKey, calloutLabelKey, sectorLabelKey, legendItemKey, angleFilterKey } = properties;
        const radiusScaleType = this.scaleManager.radiusScale.type;
        const angleScaleType = this.scaleManager.angleScale.type;

        if (radiusKey) {
            extraProps.push(
                rangedValueProperty(radiusKey, {
                    id: 'radiusValue',
                    min: this.series.properties.radiusMin ?? 0,
                    max: this.series.properties.radiusMax,
                    missingValue: this.series.properties.radiusMax ?? 1,
                    processor,
                }),
                valueProperty(radiusKey, radiusScaleType, { id: `radiusRaw`, processor }),
                normalisePropertyTo(
                    'radiusValue',
                    [0, 1],
                    1,
                    this.series.properties.radiusMin ?? 0,
                    this.series.properties.radiusMax
                )
            );
        }
        if (calloutLabelKey) {
            extraProps.push(valueProperty(calloutLabelKey, 'category', { id: `calloutLabelValue` }));
        }
        if (sectorLabelKey) {
            extraProps.push(valueProperty(sectorLabelKey, 'category', { id: `sectorLabelValue` }));
        }
        if (legendItemKey) {
            extraProps.push(valueProperty(legendItemKey, 'category', { id: `legendItemValue` }));
        }
        if (angleFilterKey) {
            extraProps.push(
                accumulativeValueProperty(angleFilterKey, angleScaleType, {
                    id: `angleFilterValue`,
                    onlyPositive: true,
                    invalidValue: 0,
                    processor,
                }),
                valueProperty(angleFilterKey, angleScaleType, { id: `angleFilterRaw` }),
                normalisePropertyTo('angleFilterValue', [0, 1], 0, 0)
            );
        }
    }

    /**
     * Check if animation validation is needed
     */
    private hasAnimationValidation(): boolean {
        return !!(
            (this.series.processedData?.reduced?.animationValidation?.uniqueKeys &&
                this.series.properties.legendItemKey) ||
            this.series.properties.calloutLabelKey ||
            this.series.properties.sectorLabelKey
        );
    }

    /**
     * Validate data and log missing value warnings
     */
    private validateAndLogMissingData(): void {
        for (const valueDef of this.series.processedData?.defs?.values ?? []) {
            const { id, missing, property } = valueDef;
            const missCount = (getMissCount as any)(this.series, missing);
            if (id !== 'angleRaw' && missCount > 0) {
                Logger.warnOnce(
                    `no value was found for the key '${String(property)}' on ${missCount} data element${
                        missCount > 1 ? 's' : ''
                    }`
                );
            }
        }
    }

    /**
     * Get processed data values with comprehensive extraction
     */
    getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): ProcessedDataValues {
        const { properties } = this.series;

        return {
            angleValues: dataModel.resolveColumnById(this.series, `angleValue`, processedData) ?? [],
            angleRawValues: dataModel.resolveColumnById(this.series, `angleRaw`, processedData) ?? [],
            angleFilterValues:
                properties.angleFilterKey != null
                    ? dataModel.resolveColumnById(this.series, `angleFilterValue`, processedData)
                    : undefined,
            angleFilterRawValues:
                properties.angleFilterKey != null
                    ? dataModel.resolveColumnById(this.series, `angleFilterRaw`, processedData)
                    : undefined,
            radiusValues: properties.radiusKey
                ? dataModel.resolveColumnById(this.series, `radiusValue`, processedData)
                : undefined,
            radiusRawValues: properties.radiusKey
                ? dataModel.resolveColumnById(this.series, `radiusRaw`, processedData)
                : undefined,
            calloutLabelValues: properties.calloutLabelKey
                ? dataModel.resolveColumnById(this.series, `calloutLabelValue`, processedData)
                : undefined,
            sectorLabelValues: properties.sectorLabelKey
                ? dataModel.resolveColumnById(this.series, `sectorLabelValue`, processedData)
                : undefined,
            legendItemValues: properties.legendItemKey
                ? dataModel.resolveColumnById(this.series, `legendItemValue`, processedData)
                : undefined,
        };
    }
}

/**
 * Data pipeline manager for complex data transformations
 */
export class DataPipelineManager {
    /**
     * Process angle filter logic
     */
    static shouldUseFilterAngles(angleFilterRawValues?: number[], angleRawValues?: number[]): boolean {
        return (
            angleFilterRawValues?.some((filterRawValue, index) => {
                return filterRawValue > (angleRawValues?.[index] ?? 0);
            }) ?? false
        );
    }

    /**
     * Calculate cross filter scale
     */
    static calculateCrossFilterScale(
        angleFilterRawValues: number[] | undefined,
        angleRawValues: number[],
        datumIndex: number,
        useFilterAngles: boolean
    ): number {
        if (angleFilterRawValues != null && !useFilterAngles) {
            return Math.sqrt(angleFilterRawValues[datumIndex] / angleRawValues[datumIndex]);
        }
        return 1;
    }

    /**
     * Process angle calculations for polar coordinates
     */
    static processAngleCalculations(
        angleScale: LinearScale,
        currentStart: number,
        currentValue: number,
        rotation: number
    ): { startAngle: number; endAngle: number; midAngle: number; span: number } {
        const startAngle = angleScale.convert(currentStart) + toRadians(rotation);
        const endAngle = angleScale.convert(currentStart + currentValue) + toRadians(rotation);
        const span = Math.abs(endAngle - startAngle);
        const midAngle = startAngle + span / 2;

        return { startAngle, endAngle, midAngle, span };
    }
}

/**
 * Data validation utilities
 */
export class DataValidationUtils {
    /**
     * Check if datum is valid for processing
     */
    static isDatumValid(datumIndex: number, invalidData?: Map<string, boolean[]>): boolean {
        return invalidData?.get('default')?.[datumIndex] !== true;
    }

    /**
     * Validate data integrity for polar series
     */
    static validatePolarData(
        processedData: ProcessedData<any>,
        seriesId: string
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        const rawData = processedData.dataSources.get(seriesId);
        if (!rawData || rawData.length === 0) {
            errors.push('No raw data found for series');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

/**
 * Data caching utilities for performance
 */
export class DataCacheManager {
    private readonly cache = new Map<string, any>();

    /**
     * Get cached processed data values
     */
    getCachedProcessedValues(key: string, calculator: () => ProcessedDataValues): ProcessedDataValues {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const values = calculator();
        this.cache.set(key, values);
        return values;
    }

    /**
     * Clear data cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Invalidate cache for specific pattern
     */
    invalidatePattern(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
}
