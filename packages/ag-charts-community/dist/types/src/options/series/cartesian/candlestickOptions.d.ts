import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AgBarSeriesStyle } from './barOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgSeriesFormatterParams, AxisOptions, FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';
export type AgCandlestickSeriesItemType = 'up' | 'down';
interface CandlestickUniqueOptions {
    /** The key to use to retrieve open values from the data. */
    openKey: string;
    /** The key to use to retrieve close values from the data. */
    closeKey: string;
    /** The key to use to retrieve high values from the data. */
    highKey: string;
    /** The key to use to retrieve low values from the data. */
    lowKey: string;
    /** A human-readable description of open values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    openName?: string;
    /** A human-readable description of close values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    closeName?: string;
    /** A human-readable description of high values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    highName?: string;
    /** A human-readable description of low values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    lowName?: string;
}
export type AgCandlestickWickOptions = StrokeOptions & LineDashOptions;
export type AgCandlestickSeriesFormatterParams<TDatum> = AgSeriesFormatterParams<TDatum> & Readonly<CandlestickUniqueOptions & Omit<AxisOptions, 'yKey'> & FillOptions & StrokeOptions & {
    /** Identifier showing whether the data element is rising (`up`) or falling (`down`). */
    itemId: AgCandlestickSeriesItemType;
    highlighted: boolean;
}>;
export interface AgCandlestickSeriesTooltipRendererParams extends CandlestickUniqueOptions, Omit<AgCartesianSeriesTooltipRendererParams, 'yKey'> {
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
    /** Configuration used for the waterfall series item types. */
    item?: AgCandlestickSeriesItem;
}
export interface AgCandlestickSeriesThemeableOptions<TDatum = any> extends Omit<AgBaseCartesianThemeableOptions<TDatum>, 'showInLegend'>, AgCandlestickSeriesStyles {
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCandlestickSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual columns, based on the given parameters. If the current column is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgCandlestickSeriesFormatterParams<TDatum>) => AgCandlestickSeriesStyles;
}
export interface AgCandlestickSeriesOptions<TDatum = any> extends AgCandlestickSeriesThemeableOptions<TDatum>, Omit<AgBaseSeriesOptions<TDatum>, 'showInLegend'>, CandlestickUniqueOptions, Omit<AxisOptions, 'yKey'> {
    /** Configuration for the Candlestick Series. */
    type: 'candlestick';
}
export {};
