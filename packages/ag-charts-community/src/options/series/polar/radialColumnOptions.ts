import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize, Ratio } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgBaseRadialColumnSeriesThemeableOptions<TDatum = any>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadialColumnSeriesTooltipRendererParams>;
    /** A formatter function for adjusting the styling of the radial columns. */
    formatter?: (params: AgRadialColumnSeriesFormatterParams<TDatum>) => AgRadialColumnSeriesFormat;
}

/** Base configuration for Radial Column series. */
export interface AgBaseRadialColumnSeriesOptions<TDatum = any>
    extends AgBaseRadialColumnSeriesThemeableOptions<TDatum>,
        AgBaseSeriesOptions<TDatum> {
    type: 'radial-column' | 'nightingale';
    /** The key to use to retrieve angle values from the data. */
    angleKey: string;
    /** A human-readable description of the angle values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    angleName?: string;
    /** The key to use to retrieve radius values from the data. */
    radiusKey: string;
    /** A human-readable description of the radius values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    radiusName?: string;

    /** Whether to group together (adjacently) separate sectors. */
    grouped?: boolean;
    /** An option indicating if the sectors should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
}

export interface AgRadialColumnSeriesThemeableOptions<TDatum = any>
    extends AgBaseRadialColumnSeriesThemeableOptions<TDatum> {
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

export interface AgRadialColumnSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    /** xKey as specified on series options. */
    readonly angleKey: string;
    /** xValue as read from series data via the xKey property. */
    readonly angleValue?: any;
    /** xName as specified on series options. */
    readonly angleName?: string;

    /** yKey as specified on series options. */
    readonly radiusKey: string;
    /** yValue as read from series data via the yKey property. */
    readonly radiusValue?: any;
    /** yName as specified on series options. */
    readonly radiusName?: string;
}

export interface AgRadialColumnSeriesFormatterParams<TDatum> {
    readonly datum: TDatum;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly angleKey: string;
    readonly radiusKey: string;
    readonly seriesId: string;
}

export interface AgRadialColumnSeriesFormat {
    fill?: CssColor;
    fillOpacity?: Opacity;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
