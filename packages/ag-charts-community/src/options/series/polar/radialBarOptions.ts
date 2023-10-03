import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgRadialBarSeriesThemeableOptions<TDatum = any>
    extends StrokeOptions,
        LineDashOptions,
        AgBaseSeriesThemeableOptions {
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadialBarSeriesTooltipRendererParams>;
    /** A formatter function for adjusting the styling of the radial bar. */
    formatter?: (params: AgRadialBarSeriesFormatterParams<TDatum>) => AgRadialBarSeriesFormat;
}

/** Configuration for Radial Bar series. */
export interface AgRadialBarSeriesOptions<TDatum = any>
    extends AgRadialBarSeriesThemeableOptions<TDatum>,
        AgBaseSeriesOptions<TDatum> {
    type: 'radial-bar';
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

export interface AgRadialBarSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
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

export interface AgRadialBarSeriesFormatterParams<TDatum> {
    readonly datum: TDatum;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly angleKey: string;
    readonly radiusKey: string;
    readonly seriesId: string;
}

export interface AgRadialBarSeriesFormat {
    fill?: CssColor;
    fillOpacity?: Opacity;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
