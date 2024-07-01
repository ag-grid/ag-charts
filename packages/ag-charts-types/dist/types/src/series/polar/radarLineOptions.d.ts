import type { AgBaseRadarSeriesOptions } from './radarOptions';
export interface AgRadarLineSeriesOptions<TDatum = any> extends AgBaseRadarSeriesOptions<TDatum> {
    /** Configuration for the Radar Line Series. */
    type: 'radar-line';
}
