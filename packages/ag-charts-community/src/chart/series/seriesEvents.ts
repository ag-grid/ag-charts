import type { ChartAxisDirection } from '../chartAxisDirection';
import type { DataModel, ProcessedData } from '../data/dataModel';

// These events are used internally for sychronising series and series-option modules:
export type InternalSeriesEventType =
    | 'data-update'
    | 'data-prerequest'
    | 'data-processed'
    | 'data-getDomain'
    | 'tooltip-getParams'
    | 'visibility-changed';

// These are events that are broadcast externally to the user (i.e. there's an API for these).
export type SeriesNodeEventTypes = 'nodeClick' | 'nodeDoubleClick';

export type SeriesEventType = InternalSeriesEventType | SeriesNodeEventTypes;

export interface BaseSeriesEvent<_T extends SeriesEventType> {}

export interface SeriesDataUpdateEvent extends BaseSeriesEvent<'data-update'> {
    readonly dataModel: DataModel<any, any, any>;
    readonly processedData: ProcessedData<any>;
}

export interface SeriesDataPrerequestEvent extends BaseSeriesEvent<'data-prerequest'> {
    readonly isContinuousX: boolean;
    readonly isContinuousY: boolean;
}

export interface SeriesDataProcessedEvent extends BaseSeriesEvent<'data-processed'> {
    readonly dataModel: DataModel<any, any, any>;
    readonly processedData: ProcessedData<any>;
}

export interface SeriesDataGetDomainEvent extends BaseSeriesEvent<'data-getDomain'> {
    readonly direction: ChartAxisDirection;
}

export interface SeriesTooltipGetParamsEvent extends BaseSeriesEvent<'tooltip-getParams'> {}

export interface SeriesVisibilityEvent extends BaseSeriesEvent<'visibility-changed'> {
    readonly itemId: any;
    readonly enabled: boolean;
}
