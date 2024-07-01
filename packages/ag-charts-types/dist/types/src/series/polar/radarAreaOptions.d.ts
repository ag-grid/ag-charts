import type { FillOptions } from '../cartesian/commonOptions';
import type { AgBaseRadarSeriesOptions, AgRadarSeriesThemeableOptions } from './radarOptions';
export interface AgRadarAreaSeriesThemeableOptions<TDatum = any> extends FillOptions, AgRadarSeriesThemeableOptions<TDatum> {
}
export interface AgRadarAreaSeriesOptions<TDatum = any> extends AgRadarAreaSeriesThemeableOptions<TDatum>, AgBaseRadarSeriesOptions<TDatum> {
    /** Configuration for the Radar Area Series. */
    type: 'radar-area';
}
