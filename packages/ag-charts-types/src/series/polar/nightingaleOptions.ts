import type { PixelSize } from '../../chart/types';
import type { AgBaseRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgBaseRadialSeriesThemeableOptions } from './radialOptions';

export interface AgNightingaleSeriesThemeableOptions<TDatum> extends AgBaseRadialSeriesThemeableOptions<TDatum> {}

export interface AgNightingaleSeriesOptions<TDatum, TContext>
    extends AgNightingaleSeriesThemeableOptions<TDatum>,
        AgBaseRadialColumnSeriesOptions<TDatum, TContext> {
    /** Configuration for Nightingale Series. */
    type: 'nightingale';
    /** Apply rounded corners to each sector. */
    cornerRadius?: PixelSize;
}
