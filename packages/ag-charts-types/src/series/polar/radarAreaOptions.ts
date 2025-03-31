import type { FillOptions } from '../cartesian/commonOptions';
import type { AgBaseRadarSeriesOptions, AgRadarSeriesThemeableOptions } from './radarOptions';

export interface AgRadarAreaSeriesThemeableOptions<TDatum> extends FillOptions, AgRadarSeriesThemeableOptions<TDatum> {}

export interface AgRadarAreaSeriesOptions<TDatum>
    extends AgRadarAreaSeriesThemeableOptions<TDatum>,
        AgBaseRadarSeriesOptions<TDatum> {
    /** Configuration for the Radar Area Series. */
    type: 'radar-area';
}
