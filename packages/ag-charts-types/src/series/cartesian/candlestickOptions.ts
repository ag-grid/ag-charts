import type { Styler } from '../../chart/callbackOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AgBarSeriesStyle } from './barOptions';
import type { AxisOptions, FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';
import type {
    AgOhlcSeriesBaseItemStylerParams,
    AgOhlcSeriesBaseOptions,
    AgOhlcSeriesBaseTooltipRendererParams,
} from './ohlcBaseOptions';

export type AgCandlestickWickOptions = StrokeOptions & LineDashOptions;

export interface AgCandlestickSeriesItemStylerParams<TDatum>
    extends AgOhlcSeriesBaseItemStylerParams<TDatum>,
        FillOptions {}

export interface AgCandlestickSeriesTooltipRendererParams<TDatum>
    extends AgOhlcSeriesBaseTooltipRendererParams<TDatum>,
        AgOhlcSeriesBaseOptions<TDatum>,
        FillOptions {}

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

export interface AgCandlestickSeriesThemeableOptions<TDatum = TDatumDefault>
    extends Omit<AgBaseCartesianThemeableOptions<TDatum>, 'showInLegend'>,
        AgCandlestickSeriesStyles {
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCandlestickSeriesTooltipRendererParams<TDatum>>;
    /** Function used to return formatting for individual columns, based on the given parameters. If the current column is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgCandlestickSeriesItemStylerParams<TDatum>, AgCandlestickSeriesItemOptions>;
}

export interface AgCandlestickSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgCandlestickSeriesThemeableOptions<TDatum>,
        AgBaseSeriesOptions<TDatum, TContext>,
        AgOhlcSeriesBaseOptions<TDatum>,
        Omit<AxisOptions<TDatum>, 'yKey'> {
    /** Configuration for the Candlestick Series. */
    type: 'candlestick';
}
