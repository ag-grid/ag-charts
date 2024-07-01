import type { AgAreaSeriesOptions } from '../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../series/cartesian/barOptions';
import type { AgBoxPlotSeriesOptions } from '../series/cartesian/boxPlotOptions';
import type { AgBubbleSeriesOptions } from '../series/cartesian/bubbleOptions';
import type { AgCandlestickSeriesOptions } from '../series/cartesian/candlestickOptions';
import type { AgHeatmapSeriesOptions } from '../series/cartesian/heatmapOptions';
import type { AgHistogramSeriesOptions } from '../series/cartesian/histogramOptions';
import type { AgLineSeriesOptions } from '../series/cartesian/lineOptions';
import type { AgOhlcSeriesOptions } from '../series/cartesian/ohlcOptions';
import type { AgRangeAreaSeriesOptions } from '../series/cartesian/rangeAreaOptions';
import type { AgRangeBarSeriesOptions } from '../series/cartesian/rangeBarOptions';
import type { AgScatterSeriesOptions } from '../series/cartesian/scatterOptions';
import type { AgWaterfallSeriesOptions } from '../series/cartesian/waterfallOptions';
import type { AgAxisLabelFormatterParams } from './axisOptions';
import type { Formatter } from './callbackOptions';
import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, Opacity, PixelSize, Ratio } from './types';
export interface AgNavigatorMiniChartIntervalOptions {
    /** Maximum gap in pixels between labels. */
    minSpacing?: PixelSize;
    /** Maximum gap in pixels between labels. */
    maxSpacing?: PixelSize;
    /** Array of values in axis units to display as labels along the axis. The values in this array must be compatible with the axis type. */
    values?: any[];
    /** The step value between labels, specified as a number or time interval. If the configured interval results in too many labels given the chart size, it will be ignored. */
    step?: number;
}
export interface AgNavigatorMiniChartLabelOptions {
    /** Configuration for interval between the Mini Chart's axis labels. */
    interval?: AgNavigatorMiniChartIntervalOptions;
    /** Set to `false` to hide the axis labels. */
    enabled?: boolean;
    /** The font style to use for the labels. */
    fontStyle?: FontStyle;
    /** The font weight to use for the labels. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: FontSize;
    /** The font family to use for the labels. */
    fontFamily?: FontFamily;
    /** Padding in pixels between the axis labels and the Mini Chart. */
    padding?: PixelSize;
    /** The colour to use for the labels. */
    color?: CssColor;
    /** Avoid axis label collision by automatically reducing the number of labels displayed. If set to `false`, axis labels may collide. */
    avoidCollisions?: boolean;
    /** Format string used when rendering labels. */
    format?: string;
    /** Function used to render axis labels. If `value` is a number, `fractionDigits` will also be provided, which indicates the number of fractional digits used in the step between intervals; for example, a tick step of `0.0005` would have `fractionDigits` set to `4`. */
    formatter?: Formatter<AgAxisLabelFormatterParams>;
}
export interface AgNavigatorMiniChartPadding {
    /** Padding between the top edge of the Navigator and the Mini Chart series. */
    top?: number;
    /** Padding between the bottom edge of the Navigator and the Mini Chart series. */
    bottom?: number;
}
type CommonIgnoredProperties = 'cursor' | 'highlightStyle' | 'listeners' | 'nodeClickRange' | 'showInLegend' | 'showInMiniChart' | 'tooltip' | 'visible' | 'xName' | 'yName';
export interface AgLineMiniChartSeriesOptions extends Omit<AgLineSeriesOptions, CommonIgnoredProperties | 'errorBar' | 'title' | 'label'> {
}
export interface AgScatterMiniChartSeriesOptions extends Omit<AgScatterSeriesOptions, CommonIgnoredProperties | 'errorBar' | 'title' | 'label' | 'labelKey' | 'labelName'> {
}
export interface AgBubbleMiniChartSeriesOptions extends Omit<AgBubbleSeriesOptions, CommonIgnoredProperties | 'title' | 'label' | 'labelKey' | 'labelName' | 'sizeName'> {
}
export interface AgAreaMiniChartSeriesOptions extends Omit<AgAreaSeriesOptions, CommonIgnoredProperties | 'area'> {
}
export interface AgBarMiniChartSeriesOptions extends Omit<AgBarSeriesOptions, CommonIgnoredProperties | 'errorBar' | 'label' | 'legendItemName' | 'direction'> {
}
export interface AgBoxPlotMiniChartSeriesOptions extends Omit<AgBoxPlotSeriesOptions, CommonIgnoredProperties | 'direction' | 'legendItemName' | 'minName' | 'q1Name' | 'medianName' | 'q3Name' | 'maxName'> {
}
export interface AgHistogramMiniChartSeriesOptions extends Omit<AgHistogramSeriesOptions, CommonIgnoredProperties | 'label'> {
}
export interface AgHeatmapMiniChartSeriesOptions extends Omit<AgHeatmapSeriesOptions, CommonIgnoredProperties | 'title' | 'label' | 'colorName' | 'textAlign' | 'verticalAlign' | 'itemPadding' | 'colorRange'> {
}
export interface AgWaterfallMiniChartSeriesOptions extends Omit<AgWaterfallSeriesOptions, CommonIgnoredProperties | 'direction'> {
}
export interface AgRangeBarMiniChartSeriesOptions extends Omit<AgRangeBarSeriesOptions, CommonIgnoredProperties | 'label' | 'direction' | 'yLowName' | 'yHighName'> {
}
export interface AgRangeAreaMiniChartSeriesOptions extends Omit<AgRangeAreaSeriesOptions, CommonIgnoredProperties | 'label' | 'yLowName' | 'yHighName'> {
}
export interface AgCandlestickMiniChartSeriesOptions extends Omit<AgCandlestickSeriesOptions, CommonIgnoredProperties> {
}
export interface AgOhlcMiniChartSeriesOptions extends Omit<AgOhlcSeriesOptions, CommonIgnoredProperties> {
}
export type AgMiniChartSeriesOptions = AgLineMiniChartSeriesOptions | AgScatterMiniChartSeriesOptions | AgBubbleMiniChartSeriesOptions | AgAreaMiniChartSeriesOptions | AgBarMiniChartSeriesOptions | AgBoxPlotMiniChartSeriesOptions | AgHistogramMiniChartSeriesOptions | AgHeatmapMiniChartSeriesOptions | AgWaterfallMiniChartSeriesOptions | AgRangeBarMiniChartSeriesOptions | AgRangeAreaMiniChartSeriesOptions | AgCandlestickMiniChartSeriesOptions | AgOhlcMiniChartSeriesOptions;
export interface AgNavigatorMiniChartOptions {
    /** Whether to show a Mini Chart in the Navigator. */
    enabled?: boolean;
    /** Override series used in Mini Chart. */
    series?: AgMiniChartSeriesOptions[];
    /** Configuration for the Mini Chart's axis labels. */
    label?: AgNavigatorMiniChartLabelOptions;
    /** Configuration for the padding inside the Mini Chart. */
    padding?: AgNavigatorMiniChartPadding;
}
export interface AgNavigatorMaskOptions {
    /** The fill colour used by the mask. */
    fill?: CssColor;
    /** The stroke colour used by the mask. */
    stroke?: CssColor;
    /** The stroke width used by the mask. */
    strokeWidth?: PixelSize;
    /** The opacity of the mask's fill in the `[0, 1]` interval, where `0` is effectively no masking. */
    fillOpacity?: Opacity;
}
export interface AgNavigatorHandleOptions {
    /** The fill colour used by the handle. */
    fill?: CssColor;
    /** The stroke colour used by the handle. */
    stroke?: CssColor;
    /** The stroke width used by the handle. */
    strokeWidth?: PixelSize;
    /** The width of the handle. */
    width?: PixelSize;
    /** The height of the handle. */
    height?: PixelSize;
    /** The distance between the handle's grip lines. */
    gripLineGap?: PixelSize;
    /** The length of the handle's grip lines. */
    gripLineLength?: PixelSize;
}
export interface AgNavigatorOptions {
    /** Whether to show the Navigator. */
    enabled?: boolean;
    /** The height of the Navigator. */
    height?: PixelSize;
    /** The distance between the Navigator and the bottom axis of the chart. */
    spacing?: PixelSize;
    /** The start of the visible range in the `[0, 1]` interval. */
    min?: Ratio;
    /** The end of the visible range in the `[0, 1]` interval. */
    max?: Ratio;
    /** Configuration for the Navigator's visible range mask. */
    mask?: AgNavigatorMaskOptions;
    /** Configuration for the Navigator's left handle. */
    minHandle?: AgNavigatorHandleOptions;
    /** Configuration for the Navigator's right handle. */
    maxHandle?: AgNavigatorHandleOptions;
    /** Mini Chart options. */
    miniChart?: AgNavigatorMiniChartOptions;
}
export {};
