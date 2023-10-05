import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type {
    AgBaseRadialColumnSeriesOptions,
    AgBaseRadialColumnSeriesThemeableOptions,
    AgRadialColumnSeriesFormat,
    AgRadialColumnSeriesFormatterParams,
    AgRadialColumnSeriesTooltipRendererParams,
} from './radialColumnOptions';

export interface AgNightingaleSeriesThemeableOptions<TDatum = any>
    extends AgBaseRadialColumnSeriesThemeableOptions<TDatum> {
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgNightingaleSeriesTooltipRendererParams>;
    /** A formatter function for adjusting the styling of the nightingale sectors. */
    formatter?: (params: AgNightingaleSeriesFormatterParams<TDatum>) => AgNightingaleSeriesFormat;
}

/** Configuration for Nightingale series. */
export interface AgNightingaleSeriesOptions<TDatum = any>
    extends AgNightingaleSeriesThemeableOptions<TDatum>,
        AgBaseRadialColumnSeriesOptions<TDatum> {
    type: 'nightingale';
}

export interface AgNightingaleSeriesTooltipRendererParams extends AgRadialColumnSeriesTooltipRendererParams {}

export interface AgNightingaleSeriesFormatterParams<TDatum> extends AgRadialColumnSeriesFormatterParams<TDatum> {}

export interface AgNightingaleSeriesFormat extends AgRadialColumnSeriesFormat {}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
