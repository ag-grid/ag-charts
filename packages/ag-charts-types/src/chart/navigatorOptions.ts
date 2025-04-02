import type { AgAreaSeriesOptions } from '../series/cartesian/areaOptions';
import type { AgBarSeriesOptions } from '../series/cartesian/barOptions';
import type { AgBoxPlotSeriesOptions } from '../series/cartesian/boxPlotOptions';
import type { AgBubbleSeriesOptions } from '../series/cartesian/bubbleOptions';
import type { AgCandlestickSeriesOptions } from '../series/cartesian/candlestickOptions';
import type { AgCartesianSeriesOptions } from '../series/cartesian/cartesianSeriesTypes';
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
import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, Opacity, PixelSize } from './types';

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
    spacing?: PixelSize;
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

export type CommonIgnoredProperties =
    | 'cursor'
    | 'highlightStyle'
    | 'listeners'
    | 'nodeClickRange'
    | 'showInLegend'
    | 'showInMiniChart'
    | 'tooltip'
    | 'visible'
    | 'xName'
    | 'yName';

export interface AgLineMiniChartSeriesOptions<TDatum>
    extends Omit<AgLineSeriesOptions<TDatum>, CommonIgnoredProperties | 'errorBar' | 'title' | 'label'> {}
export interface AgScatterMiniChartSeriesOptions<TDatum>
    extends Omit<
        AgScatterSeriesOptions<TDatum>,
        CommonIgnoredProperties | 'errorBar' | 'title' | 'label' | 'labelKey' | 'labelName'
    > {}
export interface AgBubbleMiniChartSeriesOptions<TDatum>
    extends Omit<
        AgBubbleSeriesOptions<TDatum>,
        CommonIgnoredProperties | 'title' | 'label' | 'labelKey' | 'labelName' | 'sizeName'
    > {}
export interface AgAreaMiniChartSeriesOptions<TDatum>
    extends Omit<AgAreaSeriesOptions<TDatum>, CommonIgnoredProperties> {}
export interface AgBarMiniChartSeriesOptions<TDatum>
    extends Omit<
        AgBarSeriesOptions<TDatum>,
        CommonIgnoredProperties | 'errorBar' | 'label' | 'legendItemName' | 'direction'
    > {}
export interface AgBoxPlotMiniChartSeriesOptions<TDatum>
    extends Omit<
        AgBoxPlotSeriesOptions<TDatum>,
        | CommonIgnoredProperties
        | 'direction'
        | 'legendItemName'
        | 'minName'
        | 'q1Name'
        | 'medianName'
        | 'q3Name'
        | 'maxName'
    > {}
export interface AgHistogramMiniChartSeriesOptions<TDatum>
    extends Omit<AgHistogramSeriesOptions<TDatum>, CommonIgnoredProperties | 'label'> {}
export interface AgHeatmapMiniChartSeriesOptions<TDatum>
    extends Omit<
        AgHeatmapSeriesOptions<TDatum>,
        | CommonIgnoredProperties
        | 'title'
        | 'label'
        | 'colorName'
        | 'textAlign'
        | 'verticalAlign'
        | 'itemPadding'
        | 'colorRange'
    > {}
export interface AgWaterfallMiniChartSeriesOptions<TDatum>
    extends Omit<AgWaterfallSeriesOptions<TDatum>, CommonIgnoredProperties | 'direction'> {}
export interface AgRangeBarMiniChartSeriesOptions<TDatum>
    extends Omit<
        AgRangeBarSeriesOptions<TDatum>,
        CommonIgnoredProperties | 'label' | 'direction' | 'yLowName' | 'yHighName'
    > {}
export interface AgRangeAreaMiniChartSeriesOptions<TDatum>
    extends Omit<AgRangeAreaSeriesOptions<TDatum>, CommonIgnoredProperties | 'label' | 'yLowName' | 'yHighName'> {}
export interface AgCandlestickMiniChartSeriesOptions<TDatum>
    extends Omit<AgCandlestickSeriesOptions<TDatum>, CommonIgnoredProperties> {}

export interface AgOhlcMiniChartSeriesOptions<TDatum>
    extends Omit<AgOhlcSeriesOptions<TDatum>, CommonIgnoredProperties> {}

export type AgMiniChartSeriesOptions<TDatum> =
    | AgLineMiniChartSeriesOptions<TDatum>
    | AgScatterMiniChartSeriesOptions<TDatum>
    | AgBubbleMiniChartSeriesOptions<TDatum>
    | AgAreaMiniChartSeriesOptions<TDatum>
    | AgBarMiniChartSeriesOptions<TDatum>
    | AgBoxPlotMiniChartSeriesOptions<TDatum>
    | AgHistogramMiniChartSeriesOptions<TDatum>
    | AgHeatmapMiniChartSeriesOptions<TDatum>
    | AgWaterfallMiniChartSeriesOptions<TDatum>
    | AgRangeBarMiniChartSeriesOptions<TDatum>
    | AgRangeAreaMiniChartSeriesOptions<TDatum>
    | AgCandlestickMiniChartSeriesOptions<TDatum>
    | AgOhlcMiniChartSeriesOptions<TDatum>;

type IgnoredMiniChartSeries = 'funnel' | 'cone-funnel';

// Verification checks for completeness/correctness.
const __MINI_CHART_SERIES_OPTIONS = undefined as any as Record<
    NonNullable<AgMiniChartSeriesOptions<never>['type']> | IgnoredMiniChartSeries,
    string
>;
// @ts-expect-error TS6133 - this is used to validate completeness by the compiler, but is deliberately unused.
let __VERIFY_MINI_CHART_SERIES_OPTIONS: Record<
    NonNullable<AgCartesianSeriesOptions<never>['type']>,
    string
> = undefined as any;
__VERIFY_MINI_CHART_SERIES_OPTIONS = __MINI_CHART_SERIES_OPTIONS;

export interface AgNavigatorMiniChartOptions<TDatum> {
    /** Whether to show a Mini Chart in the Navigator. */
    enabled?: boolean;
    /** Override series used in Mini Chart. */
    series?: AgMiniChartSeriesOptions<TDatum>[];
    /** Configuration for the Mini Chart's axis labels. */
    label?: AgNavigatorMiniChartLabelOptions;
    /** Configuration for the padding inside the Mini Chart. */
    padding?: AgNavigatorMiniChartPadding;
}

export interface AgNavigatorMaskOptions {
    /** The fill colour used by the mask. */
    fill?: CssColor;
    /** The opacity of the mask's fill in the `[0, 1]` interval, where `0` is effectively no masking. */
    fillOpacity?: Opacity;
    /** The stroke colour used by the mask. */
    stroke?: CssColor;
    /** The stroke width used by the mask. */
    strokeWidth?: PixelSize;
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
    /** The corner radius of the handle. */
    cornerRadius?: PixelSize;
    /** Whether to enable the grip dots. */
    grip?: boolean;
}

export interface AgNavigatorOptions<TDatum> {
    /** Whether to show the Navigator. */
    enabled?: boolean;
    /** The height of the Navigator. */
    height?: PixelSize;
    /** The corner radius used by the Navigator. */
    cornerRadius?: number;
    /** The distance between the Navigator and the bottom axis of the chart. */
    spacing?: PixelSize;
    /** Configuration for the Navigator's visible range mask. */
    mask?: AgNavigatorMaskOptions;
    /** Configuration for the Navigator's left handle. */
    minHandle?: AgNavigatorHandleOptions;
    /** Configuration for the Navigator's right handle. */
    maxHandle?: AgNavigatorHandleOptions;
    /** Mini Chart options. */
    miniChart?: AgNavigatorMiniChartOptions<TDatum>;
}
