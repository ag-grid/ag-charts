import type { AgChartLabelOptions } from '../../options/chartOptions';
import type { AgSeriesTooltip, AgTooltipRendererResult } from '../../options/tooltipOptions';
import type {
    AgBaseRadialColumnSeriesOptions,
    AgRadialColumnSeriesFormat,
    AgRadialColumnSeriesFormatterParams,
    AgRadialColumnSeriesLabelFormatterParams,
    AgRadialColumnSeriesTooltipRendererParams,
} from './radialColumnOptions';

/** Configuration for Nightingale series. */
export interface AgNightingaleSeriesOptions<DatumType = any> extends AgBaseRadialColumnSeriesOptions<DatumType> {
    type?: 'nightingale';
    /** Configuration for the labels shown on top of data points. */
    label?: AgNightingaleSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgNightingaleSeriesTooltip;
    /** A formatter function for adjusting the styling of the nightingale sectors. */
    formatter?: (params: AgNightingaleSeriesFormatterParams<DatumType>) => AgNightingaleSeriesFormat;
}

export interface AgNightingaleSeriesTooltipRendererParams extends AgRadialColumnSeriesTooltipRendererParams {}

export interface AgNightingaleSeriesLabelFormatterParams extends AgRadialColumnSeriesLabelFormatterParams {}

export interface AgNightingaleSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. By default the values are simply stringified. */
    formatter?: (params: AgNightingaleSeriesLabelFormatterParams) => string;
}

export interface AgNightingaleSeriesTooltip extends AgSeriesTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgNightingaleSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
    format?: string;
}

export interface AgNightingaleSeriesFormatterParams<DatumType> extends AgRadialColumnSeriesFormatterParams<DatumType> {}

export interface AgNightingaleSeriesFormat extends AgRadialColumnSeriesFormat {}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
