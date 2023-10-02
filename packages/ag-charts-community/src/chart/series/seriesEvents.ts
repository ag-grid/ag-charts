import type { ChartAxisDirection } from '../chartAxisDirection';
import type { DataModel, ProcessedData } from '../data/dataModel';

export type SeriesEventType =
    | 'data-update'
    | 'processData-prerequest'
    | 'data-processed'
    | 'getDomain'
    | 'visibility-changed';

export interface BaseSeriesEvent<_T extends SeriesEventType> {}

export interface SeriesDataUpdateEvent extends BaseSeriesEvent<'data-update'> {
    readonly dataModel: DataModel<any, any, any>;
    readonly processedData: ProcessedData<any>;
}

export interface SeriesPrerequestDataEvent extends BaseSeriesEvent<'processData-prerequest'> {
    readonly isContinuousX: boolean;
    readonly isContinuousY: boolean;
}

export interface SeriesDataProcessedEvent extends BaseSeriesEvent<'data-processed'> {
    readonly dataModel: DataModel<any, any, any>;
    readonly processedData: ProcessedData<any>;
}

export interface SeriesGetDomainDataEvent extends BaseSeriesEvent<'getDomain'> {
    readonly direction: ChartAxisDirection;
}

export interface SeriesVisibilityEvent extends BaseSeriesEvent<'visibility-changed'> {
    readonly itemId: any;
    readonly enabled: boolean;
}
