import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesThemeableOptions } from '../seriesOptions';
export interface AgBaseRadialSeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions<TDatum>, AgRadialSeriesStyle {
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgRadialSeriesLabelFormatterParams>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadialSeriesTooltipRendererParams<TDatum>>;
    /** A styler function for adjusting the styling of the radial columns. */
    itemStyler?: Styler<AgRadialSeriesItemStylerParams<TDatum>, AgRadialSeriesStyle>;
}
export interface AgRadialSeriesOptionsKeys {
    /** The key to use to retrieve angle values from the data. */
    angleKey: string;
    /** The key to use to retrieve radius values from the data. */
    radiusKey: string;
}
export interface AgRadialSeriesOptionsNames {
    /** A human-readable description of the angle values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    angleName?: string;
    /** A human-readable description of the radius values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    radiusName?: string;
}
export type AgRadialSeriesLabelFormatterParams = AgRadialSeriesOptionsKeys & AgRadialSeriesOptionsNames;
export interface AgRadialSeriesTooltipRendererParams<TDatum> extends AgSeriesTooltipRendererParams<TDatum>, AgRadialSeriesOptionsKeys, AgRadialSeriesOptionsNames {
    /** xValue as read from series data via the xKey property. */
    readonly angleValue?: any;
    /** yValue as read from series data via the yKey property. */
    readonly radiusValue?: any;
}
export type AgRadialSeriesItemStylerParams<TDatum> = DatumCallbackParams<TDatum> & AgRadialSeriesOptionsKeys & Required<AgRadialSeriesStyle>;
export interface AgRadialSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Apply rounded corners to each bar. */
    cornerRadius?: PixelSize;
}
