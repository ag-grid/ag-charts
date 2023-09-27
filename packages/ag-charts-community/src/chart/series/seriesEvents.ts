import type { DataModel, ProcessedData, PropertyDefinition } from '../data/dataModel';

export type SeriesEventType = 'data-model' | 'processData-prerequest' | 'visibility-changed';

export interface BaseSeriesEvent<_T extends SeriesEventType> {}

export interface SeriesDataEvent extends BaseSeriesEvent<'data-model'> {
    dataModel: DataModel<any, any, any>;
    processedData: ProcessedData<any>;
}

export interface SeriesPrerequestDataEvent extends BaseSeriesEvent<'processData-prerequest'> {
    props: PropertyDefinition<string>[];
    isContinuousX: boolean;
    isContinuousY: boolean;
}

export interface SeriesVisibilityEvent extends BaseSeriesEvent<'visibility-changed'> {
    itemId: any;
    enabled: boolean;
}
