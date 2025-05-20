import type { AgBaseRadarSeriesOptions } from './radarOptions';

export interface AgRadarLineSeriesOptions<TDatum, TContext> extends AgBaseRadarSeriesOptions<TDatum, TContext> {
    /** Configuration for the Radar Line Series. */
    type: 'radar-line';
}
