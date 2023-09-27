import type { DataModel, ProcessedData } from '../data/dataModel';

export type SeriesEventType = 'data-model' | 'visibility-changed';

export interface BaseSeriesEvent<_T extends SeriesEventType> {}

export interface SeriesDataEvent extends BaseSeriesEvent<'data-model'> {
    dataModel: DataModel<any, any, any>;
    processedData: ProcessedData<any>;
};

export interface SeriesVisibilityEvent extends BaseSeriesEvent<'visibility-changed'> {
    itemId: any;
    enabled: boolean;
};
