import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgBaseRadarSeriesOptions } from './radarOptions';

export interface AgRadarLineSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseRadarSeriesOptions<TDatum, TContext> {
    /** Configuration for the Radar Line Series. */
    type: 'radar-line';
}
