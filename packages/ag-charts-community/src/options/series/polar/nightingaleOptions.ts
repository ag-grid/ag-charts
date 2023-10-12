import type { AgBaseRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgBaseRadialSeriesThemeableOptions } from './radialOptions';

export type AgNightingaleSeriesThemeableOptions<TDatum = any> = AgBaseRadialSeriesThemeableOptions<TDatum>;

/** Configuration for Nightingale series. */
export interface AgNightingaleSeriesOptions<TDatum = any>
    extends AgNightingaleSeriesThemeableOptions<TDatum>,
        AgBaseRadialColumnSeriesOptions<TDatum> {
    type: 'nightingale';
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
