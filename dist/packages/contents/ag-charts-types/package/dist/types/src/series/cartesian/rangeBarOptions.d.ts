import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { PixelSize } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions, AgSeriesHighlightStyle } from '../seriesOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';
export type AgRangeBarSeriesItemStylerParams<TDatum> = DatumCallbackParams<TDatum> & AgRangeBarSeriesOptionsKeys & Required<AgRangeBarSeriesStyle>;
export interface AgRangeBarSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Apply rounded corners to each bar. */
    cornerRadius?: PixelSize;
}
export type AgRangeBarSeriesTooltipRendererParams<TDatum> = AgSeriesTooltipRendererParams<TDatum> & AgRangeBarSeriesOptionsKeys & AgRangeBarSeriesOptionsNames;
export interface AgRangeBarSeriesLabelOptions<TDatum> extends AgChartLabelOptions<TDatum, AgRangeBarSeriesLabelFormatterParams> {
    /** Where to render series labels relative to the bars. */
    placement?: AgRangeBarSeriesLabelPlacement;
    /** Padding in pixels between the label and the edge of the bar. */
    padding?: PixelSize;
}
export type AgRangeBarSeriesLabelPlacement = 'inside' | 'outside';
export interface AgRangeBarSeriesThemeableOptions<TDatum = any> extends AgBaseCartesianThemeableOptions<TDatum>, AgRangeBarSeriesStyle {
    /**
     * Bar rendering direction.
     *
     * __Note:__ This option affects the layout direction of X and Y data values.
     */
    direction?: 'horizontal' | 'vertical';
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRangeBarSeriesTooltipRendererParams<TDatum>>;
    /** Configuration for the range series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRangeBarSeriesLabelOptions<TDatum>;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Function used to return formatting for individual RangeBar series item cells, based on the given parameters. If the current cell is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgRangeBarSeriesItemStylerParams<TDatum>, AgRangeBarSeriesStyle>;
}
export type AgRangeBarSeriesLabelFormatterParams = AgRangeBarSeriesOptionsKeys & AgRangeBarSeriesOptionsNames;
export interface AgRangeBarSeriesOptionsKeys {
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-low-values from the data. */
    yLowKey: string;
    /** The key to use to retrieve y-high-values from the data. */
    yHighKey: string;
}
export interface AgRangeBarSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** A human-readable description of the y-low-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yLowName?: string;
    /** A human-readable description of the y-high-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yHighName?: string;
}
export interface AgRangeBarSeriesOptions<TDatum = any> extends AgRangeBarSeriesOptionsKeys, AgRangeBarSeriesOptionsNames, AgRangeBarSeriesThemeableOptions<TDatum>, AgBaseSeriesOptions<TDatum> {
    /** Configuration for the Range Bar Series. */
    type: 'range-bar';
}
