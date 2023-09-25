import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type {
    AgBaseRadialColumnSeriesOptions,
    AgBaseRadialColumnSeriesThemeableOptions,
    AgRadialColumnSeriesFormat,
    AgRadialColumnSeriesFormatterParams,
    AgRadialColumnSeriesLabelFormatterParams,
    AgRadialColumnSeriesTooltipRendererParams,
} from './radialColumnOptions';

export interface AgNightingaleSeriesThemeableOptions<DatumType = any>
    extends AgBaseRadialColumnSeriesThemeableOptions<DatumType> {
    /** Configuration for the labels shown on top of data points. */
    label?: AgNightingaleSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgNightingaleSeriesTooltipRendererParams>;
    /** A formatter function for adjusting the styling of the nightingale sectors. */
    formatter?: (params: AgNightingaleSeriesFormatterParams<DatumType>) => AgNightingaleSeriesFormat;
}

/** Configuration for Nightingale series. */
export interface AgNightingaleSeriesOptions<DatumType = any>
    extends AgNightingaleSeriesThemeableOptions<DatumType>,
        AgBaseRadialColumnSeriesOptions<DatumType> {
    type: 'nightingale';
}

export interface AgNightingaleSeriesTooltipRendererParams extends AgRadialColumnSeriesTooltipRendererParams {}

export interface AgNightingaleSeriesLabelFormatterParams extends AgRadialColumnSeriesLabelFormatterParams {}

export interface AgNightingaleSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. By default the values are simply stringified. */
    formatter?: (params: AgNightingaleSeriesLabelFormatterParams) => string;
}

export interface AgNightingaleSeriesFormatterParams<DatumType> extends AgRadialColumnSeriesFormatterParams<DatumType> {}

export interface AgNightingaleSeriesFormat extends AgRadialColumnSeriesFormat {}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
