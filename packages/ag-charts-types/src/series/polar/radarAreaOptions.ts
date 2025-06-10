import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { FillOptions } from '../cartesian/commonOptions';
import type { AgBaseRadarSeriesOptions, AgRadarSeriesThemeableOptions } from './radarOptions';

export interface AgRadarAreaSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends FillOptions,
        AgRadarSeriesThemeableOptions<TDatum, TContext> {}

export interface AgRadarAreaSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgRadarAreaSeriesThemeableOptions<TDatum, TContext>,
        AgBaseRadarSeriesOptions<TDatum, TContext> {
    /** Configuration for the Radar Area Series. */
    type: 'radar-area';
}
