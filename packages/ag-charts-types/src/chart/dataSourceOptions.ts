import type { AgZoomEventSource } from './eventOptions';
import type { ContextDefault, DatumDefault } from './types';

/**
 * Indicates what triggered a `dataSource` request:
 * - `'user-interaction'` — zoom, pan, scroll or keyboard navigation.
 * - `'chart-update'` — the initial render or a programmatic update such as `chart.update()` or `chart.updateDelta({})`.
 * - `'state-change'` — a `chart.setState()` call.
 * - `'sync'` — a zoom synchronised from another chart.
 */
export type AgDataSourceRequestSource = AgZoomEventSource;

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
    /**
     * What triggered the request, for distinguishing user-initiated fetches from programmatic ones to avoid re-fetch loops.
     *
     * `undefined` on internal restore paths that do not originate from a chart update.
     */
    source?: AgDataSourceRequestSource;
}
