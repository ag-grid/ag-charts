import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AgBarSeriesStyle } from './barOptions';
import type { AgCandlestickSeriesBaseFormatterParams, AgCandlestickSeriesBaseOptions, AgCandlestickSeriesBaseTooltipRendererParams } from './candlestickBaseOptions';
import type { AxisOptions, FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';
export type AgCandlestickWickOptions = StrokeOptions & LineDashOptions;
export interface AgCandlestickSeriesFormatterParams<TDatum> extends AgCandlestickSeriesBaseFormatterParams<TDatum>, FillOptions {
}
export interface AgCandlestickSeriesTooltipRendererParams extends AgCandlestickSeriesBaseTooltipRendererParams, AgCandlestickSeriesBaseOptions {
    fill?: CssColor;
}
export interface AgCandlestickSeriesItemOptions extends AgBarSeriesStyle {
    /** Options to style chart's wicks */
    wick?: AgCandlestickWickOptions;
}
export interface AgCandlestickSeriesItem {
    /** Configuration for the rising series items. */
    up?: AgCandlestickSeriesItemOptions;
    /** Configuration for the falling series items. */
    down?: AgCandlestickSeriesItemOptions;
}
export interface AgCandlestickSeriesStyles {
    /** Configuration used for the series items. */
    item?: AgCandlestickSeriesItem;
}
export interface AgCandlestickSeriesThemeableOptions<TDatum = any> extends Omit<AgBaseCartesianThemeableOptions<TDatum>, 'showInLegend'>, AgCandlestickSeriesStyles {
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCandlestickSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual columns, based on the given parameters. If the current column is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgCandlestickSeriesFormatterParams<TDatum>) => AgCandlestickSeriesItemOptions;
}
export interface AgCandlestickSeriesOptions<TDatum = any> extends AgCandlestickSeriesThemeableOptions<TDatum>, Omit<AgBaseSeriesOptions<TDatum>, 'showInLegend'>, AgCandlestickSeriesBaseOptions, Omit<AxisOptions, 'yKey'> {
    /** Configuration for the Candlestick Series. */
    type: 'candlestick';
}
