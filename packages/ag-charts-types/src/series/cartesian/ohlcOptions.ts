import type { Styler } from '../../chart/callbackOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AxisOptions, LineDashOptions, StrokeOptions } from './commonOptions';
import type {
    AgOhlcSeriesBaseItemStylerParams,
    AgOhlcSeriesBaseOptions,
    AgOhlcSeriesBaseTooltipRendererParams,
} from './ohlcBaseOptions';

export type AgOhlcSeriesItemStylerParams<TDatum = TDatumDefault> = AgOhlcSeriesBaseItemStylerParams<TDatum>;

export interface AgOhlcSeriesTooltipRendererParams<TDatum>
    extends AgOhlcSeriesBaseTooltipRendererParams<TDatum>,
        AgOhlcSeriesBaseOptions<TDatum>,
        AgOhlcSeriesItemOptions {}

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

export interface AgOhlcSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends Omit<AgBaseCartesianThemeableOptions<TDatum, TContext>, 'showInLegend'>,
        AgOhlcSeriesStyles {
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgOhlcSeriesTooltipRendererParams<TDatum>>;
    /** Function used to return formatting for individual items, based on the given parameters. If the current datum is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgOhlcSeriesItemStylerParams<TDatum>, AgOhlcSeriesItemOptions>;
}

export interface AgOhlcSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgOhlcSeriesThemeableOptions<TDatum, TContext>,
        AgBaseSeriesOptions<TDatum, TContext>,
        AgOhlcSeriesBaseOptions<TDatum>,
        Omit<AxisOptions<TDatum>, 'yKey'> {
    /** Configuration for the OHLC Series. */
    type: 'ohlc';
}
