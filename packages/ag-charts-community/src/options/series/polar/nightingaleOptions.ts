import type { PixelSize } from '../../agChartOptions';
import type { AgBaseRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgBaseRadialSeriesThemeableOptions } from './radialOptions';

export interface AgNightingaleSeriesThemeableOptions<TDatum = any> extends AgBaseRadialSeriesThemeableOptions<TDatum> {
    /** The minimum spacing between nightingale sectors. If axis padding is enabled, the sector spacing will be disabled on the radial edges. */
    sectorSpacing?: PixelSize;
}

export interface AgNightingaleSeriesOptions<TDatum = any>
    extends AgNightingaleSeriesThemeableOptions<TDatum>,
        AgBaseRadialColumnSeriesOptions<TDatum> {
    /** Configuration for Nightingale Series. */
    type: 'nightingale';
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
