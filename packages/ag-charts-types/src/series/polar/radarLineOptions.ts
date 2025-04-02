import type { AgBaseRadarSeriesOptions } from './radarOptions';

export interface AgRadarLineSeriesOptions<TDatum> extends AgBaseRadarSeriesOptions<TDatum> {
    /** Configuration for the Radar Line Series. */
    type: 'radar-line';
}
