import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AgCandlestickSeriesBaseFormatterParams, AgCandlestickSeriesBaseOptions, AgCandlestickSeriesBaseTooltipRendererParams, AgCandlestickSeriesItemType } from './candlestickBaseOptions';
import type { AxisOptions, LineDashOptions, StrokeOptions } from './commonOptions';
export type AgOhlcSeriesItemType = AgCandlestickSeriesItemType;
export interface AgOhlcSeriesBaseOptions extends AgCandlestickSeriesBaseOptions {
}
export interface AgOhlcSeriesFormatterParams<TDatum> extends AgCandlestickSeriesBaseFormatterParams<TDatum> {
}
export interface AgOhlcSeriesTooltipRendererParams extends AgCandlestickSeriesBaseTooltipRendererParams, AgOhlcSeriesBaseOptions {
    stroke?: CssColor;
}
export type AgOhlcSeriesItemOptions = StrokeOptions & LineDashOptions;
export interface AgOhlcSeriesItem {
    /** Configuration for the rising series items. */
    up?: AgOhlcSeriesItemOptions;
    /** Configuration for the falling series items. */
    down?: AgOhlcSeriesItemOptions;
}
export interface AgOhlcSeriesStyles {
    /** Configuration used for the series items. */
    item?: AgOhlcSeriesItem;
}
export interface AgOhlcSeriesThemeableOptions<TDatum = any> extends Omit<AgBaseCartesianThemeableOptions<TDatum>, 'showInLegend'>, AgOhlcSeriesStyles {
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOhlcSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual items, based on the given parameters. If the current datum is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgOhlcSeriesFormatterParams<TDatum>) => AgOhlcSeriesItemOptions;
}
export interface AgOhlcSeriesOptions<TDatum = any> extends AgOhlcSeriesThemeableOptions<TDatum>, Omit<AgBaseSeriesOptions<TDatum>, 'showInLegend'>, AgOhlcSeriesBaseOptions, Omit<AxisOptions, 'yKey'> {
    /** Configuration for the OHLC Series. */
    type: 'ohlc';
}
