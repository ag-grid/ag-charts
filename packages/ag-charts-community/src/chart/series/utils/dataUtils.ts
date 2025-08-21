import type { DataController } from '../../data/dataController';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import type { DataModelSeriesNodeDatum } from '../dataModelSeries';
import {
    type NodeDataResult,
    type ProcessedDataValues,
    type SeriesDataContext,
    type SeriesDataProperties,
} from './interfaces';

/**
 * Interface for data processing functionality
 */
export interface DataProcessor<TDatum extends DataModelSeriesNodeDatum = DataModelSeriesNodeDatum> {
    /**
     * Process data from data controller
     */
    processData(dataController: DataController): Promise<void>;

    /**
     * Create node data from processed data
     */
    createNodeData(): NodeDataResult<TDatum> | undefined;

    /**
     * Get processed data values
     */
    getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): ProcessedDataValues;
}

/**
 * Polar data processor implementation for pie/donut series
 */
export class PolarDataProcessor<TDatum extends DataModelSeriesNodeDatum = DataModelSeriesNodeDatum>
    implements DataProcessor<TDatum>
{
    constructor(private readonly series: SeriesDataContext & { properties: SeriesDataProperties }) {}

    async processData(dataController: DataController): Promise<void> {
        if (this.series.data == null) {
            return;
        }

        // Transition animation state
        this.series.animationState.transition('updateData');

        // Request data model from the data controller
        const dataModel = await this.series.requestDataModel(dataController);

        if (!dataModel) {
            return;
        }

        // Store the data model on the series
        (this.series as any).dataModel = dataModel;
        // Note: processedData is available through dataModel, not as a separate property
    }

    createNodeData(): NodeDataResult<TDatum> | undefined {
        const { dataModel, processedData } = this.series;

        if (!dataModel || !processedData) {
            return undefined;
        }

        // Get the raw data for this series
        const rawData = processedData.dataSources.get(this.series.id);
        if (!rawData || rawData.length === 0) {
            return undefined;
        }

        // For polar series, node data and label data are typically the same
        const nodeData: TDatum[] = rawData as TDatum[];
        const labelData: TDatum[] = rawData as TDatum[];

        return {
            itemId: this.series.id,
            nodeData,
            labelData,
            // phantomNodeData can be undefined for basic implementation
            phantomNodeData: undefined,
        };
    }

    getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): ProcessedDataValues {
        const { properties } = this.series;

        // Extract all the processed data values based on the series properties
        const angleValues = dataModel.resolveColumnById(this.series, `angleValue`, processedData) ?? [];
        const angleRawValues = dataModel.resolveColumnById(this.series, `angleRaw`, processedData) ?? [];

        const angleFilterValues =
            properties.angleFilterKey != null
                ? dataModel.resolveColumnById(this.series, `angleFilterValue`, processedData)
                : undefined;
        const angleFilterRawValues =
            properties.angleFilterKey != null
                ? dataModel.resolveColumnById(this.series, `angleFilterRaw`, processedData)
                : undefined;

        const radiusValues = properties.radiusKey
            ? dataModel.resolveColumnById(this.series, `radiusValue`, processedData)
            : undefined;
        const radiusRawValues = properties.radiusKey
            ? dataModel.resolveColumnById(this.series, `radiusRaw`, processedData)
            : undefined;

        const calloutLabelValues = properties.calloutLabelKey
            ? dataModel.resolveColumnById(this.series, `calloutLabelValue`, processedData)
            : undefined;
        const sectorLabelValues = properties.sectorLabelKey
            ? dataModel.resolveColumnById(this.series, `sectorLabelValue`, processedData)
            : undefined;
        const legendItemValues = properties.legendItemKey
            ? dataModel.resolveColumnById(this.series, `legendItemValue`, processedData)
            : undefined;

        return {
            angleValues,
            angleRawValues,
            angleFilterValues,
            angleFilterRawValues,
            radiusValues,
            radiusRawValues,
            calloutLabelValues,
            sectorLabelValues,
            legendItemValues,
        };
    }
}
