import type { DataModel, ProcessedData } from '../data/dataModel';

export type SeriesEventType = 'data-update' | 'processData-prerequest' | 'visibility-changed';

export interface BaseSeriesEvent<_T extends SeriesEventType> {}

export interface SeriesDataUpdateEvent extends BaseSeriesEvent<'data-update'> {
    readonly dataModel: DataModel<any, any, any>;
    readonly processedData: ProcessedData<any>;
}

export interface SeriesPrerequestDataEvent extends BaseSeriesEvent<'processData-prerequest'> {
    readonly isContinuousX: boolean;
    readonly isContinuousY: boolean;
}

export interface SeriesVisibilityEvent extends BaseSeriesEvent<'visibility-changed'> {
    readonly itemId: any;
    readonly enabled: boolean;
}
