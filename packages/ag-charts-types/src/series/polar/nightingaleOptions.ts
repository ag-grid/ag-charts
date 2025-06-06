import type { PixelSize, TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgBaseRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgBaseRadialSeriesThemeableOptions } from './radialOptions';

export interface AgNightingaleSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseRadialSeriesThemeableOptions<TDatum, TContext> {}

export interface AgNightingaleSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgNightingaleSeriesThemeableOptions<TDatum, TContext>,
        AgBaseRadialColumnSeriesOptions<TDatum, TContext> {
    /** Configuration for Nightingale Series. */
    type: 'nightingale';
    /** Apply rounded corners to each sector. */
    cornerRadius?: PixelSize;
}
