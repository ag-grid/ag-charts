import type { TDatumDefault } from './types';

export interface AgDataSourceOptions<TDatum = TDatumDefault> {
    /** Asynchronous callback to load data into the chart. */
    getData: (params: AgDataSourceCallbackParams) => Promise<TDatum[]>;
}

export interface AgDataSourceCallbackParams {
    /** The start of the visible window, if a time axis is available. */
    windowStart?: Date;
    /** The end of the visible window, if a time axis is available. */
    windowEnd?: Date;
}
