import type { ContextDefault, DatumDefault } from './types';

export interface AgDataSourceOptions<TDatum = DatumDefault, TContext = ContextDefault> {
    /** Asynchronous callback to load data into the chart. */
    getData: (params: AgDataSourceCallbackParams<TContext>) => Promise<TDatum[]>;
}

export interface AgDataSourceCallbackParams<TContext = ContextDefault> {
    /** The start of the visible window on the x-axis. `undefined` on the initial load if no axis bounds have been established. */
    windowStart?: Date | number | string;
    /** The end of the visible window on the x-axis. `undefined` on the initial load if no axis bounds have been established. */
    windowEnd?: Date | number | string;
    /** Chart context object. */
    context?: TContext;
}
