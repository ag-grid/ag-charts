import type { DataModel, ProcessedData } from '../data/dataModel';

export type SeriesEventType = 'data-update' | 'data-processed' | 'visibility-changed';

export interface SeriesDataUpdateEvent {
    readonly dataModel: DataModel<any, any, any>;
    readonly processedData: ProcessedData<any>;
}

export interface SeriesDataProcessedEvent {
    readonly dataModel: DataModel<any, any, any>;
    readonly processedData: ProcessedData<any>;
}

export interface SeriesVisibilityEvent {
    readonly itemId: any;
    readonly enabled: boolean;
}
