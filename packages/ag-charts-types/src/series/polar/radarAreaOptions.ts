import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { FillOptions } from '../cartesian/commonOptions';
import type { AgHighlightStyleOptions, AgMultiSeriesHighlightOptions } from '../seriesOptions';
import type { AgBaseRadarSeriesOptions, AgRadarSeriesThemeableOptions } from './radarOptions';

export interface AgRadarAreaSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends FillOptions,
        AgRadarSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesHighlightOptions<AgHighlightStyleOptions>;
}

export interface AgRadarAreaSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgRadarAreaSeriesThemeableOptions<TDatum, TContext>,
        Omit<AgBaseRadarSeriesOptions<TDatum, TContext>, 'highlight'> {
    /** Configuration for the Radar Area Series. */
    type: 'radar-area';
}
