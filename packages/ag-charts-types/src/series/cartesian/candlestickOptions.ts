import type { Styler } from '../../chart/callbackOptions';
import type { AgCrosshairSnapMode } from '../../chart/crosshairOptions';
import type { AgDropShadowOptions, AgGlowOptions, AgItemShadowStyle } from '../../chart/dropShadowOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { ContextDefault, DatumDefault } from '../../chart/types';
import type {
    AgBaseCartesianThemeableOptions,
    AgBaseSeriesOptions,
    AgMultiSeriesGlowHighlightOptions,
} from '../seriesOptions';
import type { AgBarSeriesStyle } from './barOptions';
import type {
    AgBaseCartesianSeriesAxisOptions,
    AxisOptions,
    FillOptions,
    LineDashOptions,
    StrokeOptions,
} from './commonOptions';
import type {
    AgOhlcSeriesBaseItemStylerParams,
    AgOhlcSeriesBaseOptions,
    AgOhlcSeriesBaseTooltipRendererParams,
} from './ohlcBaseOptions';
import type { AgOhlcCrosshairSnapValue } from './ohlcOptions';

export type AgCandlestickWickOptions = StrokeOptions & LineDashOptions;

export interface AgCandlestickSeriesItemStylerParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgOhlcSeriesBaseItemStylerParams<TDatum, TContext>, FillOptions {}

export interface AgCandlestickSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgOhlcSeriesBaseTooltipRendererParams<TDatum, TContext>, AgOhlcSeriesBaseOptions<TDatum>, FillOptions {}

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

export interface AgCandlestickSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgBaseCartesianThemeableOptions<TDatum, TContext>, 'showInLegend'>, AgCandlestickSeriesStyles {
    /**
     * The values of the highlighted datum that the value-axis crosshair snaps to.
     */
    crosshairSnapTo?: AgOhlcCrosshairSnapValue[];
    /**
     * Whether the crosshair snaps to every value in `crosshairSnapTo`, or only the one nearest the pointer.
     *
     * Default: `'all'`
     */
    crosshairSnapMode?: AgCrosshairSnapMode;
    /** Configuration for the shadow used behind the series items, including the wicks. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the glow around the candles. The `highlight` options override it, field by field. Off unless set: `glow: {}` turns it on. */
    glow?: AgGlowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgCandlestickSeriesTooltipRendererParams<TDatum, TContext>>;
    /** Function used to return formatting for individual columns, based on the given parameters.*/
    itemStyler?: Styler<
        AgCandlestickSeriesItemStylerParams<TDatum, TContext>,
        AgCandlestickSeriesItemOptions & AgItemShadowStyle
    >;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesGlowHighlightOptions<
        AgCandlestickHighlightStyleOptions,
        AgCandlestickHighlightStyleOptions
    >;
}
export interface AgCandlestickHighlightStyleOptions extends AgCandlestickSeriesItemOptions {
    /** The opacity of the whole series (line, fill, labels and markers, if any) */
    opacity?: number;
}

export interface AgCandlestickSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        AgCandlestickSeriesThemeableOptions<TDatum, TContext>,
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlight'>,
        AgBaseCartesianSeriesAxisOptions,
        AgOhlcSeriesBaseOptions<TDatum>,
        Omit<AxisOptions<TDatum>, 'yKey'> {
    /** Configuration for the Candlestick Series. */
    type: 'candlestick';
}
