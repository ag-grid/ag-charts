import type { PixelSize } from '../../chart/types';
import type { AgBaseRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgBaseRadialSeriesThemeableOptions } from './radialOptions';
export interface AgNightingaleSeriesThemeableOptions<TDatum = any> extends AgBaseRadialSeriesThemeableOptions<TDatum> {
}
export interface AgNightingaleSeriesOptions<TDatum = any> extends AgNightingaleSeriesThemeableOptions<TDatum>, AgBaseRadialColumnSeriesOptions<TDatum> {
    /** Configuration for Nightingale Series. */
    type: 'nightingale';
    /** Apply rounded corners to each sector. */
    cornerRadius?: PixelSize;
}
