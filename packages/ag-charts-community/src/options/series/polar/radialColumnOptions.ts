import type { Ratio } from '../../chart/types';
import type { AgBaseSeriesOptions } from '../seriesOptions';
import type {
    AgBaseRadialSeriesThemeableOptions,
    AgRadialSeriesOptionsKeys,
    AgRadialSeriesOptionsNames,
} from './radialOptions';

/** Base configuration for Radial Column series. */
export interface AgBaseRadialColumnSeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgRadialSeriesOptionsKeys,
        AgRadialSeriesOptionsNames,
        AgBaseRadialSeriesThemeableOptions<TDatum> {
    type: 'radial-column' | 'nightingale';

    /** Whether to group together (adjacently) separate sectors. */
    grouped?: boolean;
    /** An option indicating if the sectors should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
}

export interface AgRadialColumnSeriesThemeableOptions<TDatum = any> extends AgBaseRadialSeriesThemeableOptions<TDatum> {
    /** The ratio used to calculate the column width based on the circumference and padding between items. */
    columnWidthRatio?: Ratio;
    /** Prevents columns from becoming too wide. This value is relative to the diameter of the polar chart. */
    maxColumnWidthRatio?: Ratio;
}

/** Configuration for Radial Column series. */
export interface AgRadialColumnSeriesOptions<TDatum = any>
    extends AgRadialColumnSeriesThemeableOptions<TDatum>,
        AgBaseRadialColumnSeriesOptions<TDatum> {
    type: 'radial-column';
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
