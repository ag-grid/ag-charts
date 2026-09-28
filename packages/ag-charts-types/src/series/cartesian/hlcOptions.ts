import type {
    ContextCallbackParams,
    DatumItemCallbackParams,
    HighlightState,
    SelectionState,
    SeriesCallbackParams,
    Styler,
} from '../../chart/callbackOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { ContextDefault, DatumDefault, DatumKey } from '../../chart/types';
import type { AgInterpolationType } from '../interpolationOptions';
import type { AgSeriesMarkerOptions, AgSeriesMarkerStyle } from '../markerOptions';
import type {
    AgBaseCartesianThemeableOptions,
    AgBaseSeriesOptions,
    AgHighlightStyleOptions,
    AgMultiSeriesHighlightOptions,
} from '../seriesOptions';
import type { AgCartesianSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { AgBaseCartesianSeriesAxisOptions, FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

/** The part of an HLC datum an item represents: its high, low or close value. */
export type AgHlcSeriesItemType = 'high' | 'low' | 'close';

export interface AgHlcSeriesOptionsKeys<TDatum = DatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: DatumKey<TDatum>;
    /** The key to use to retrieve high values from the data. */
    highKey: DatumKey<TDatum>;
    /** The key to use to retrieve low values from the data. */
    lowKey: DatumKey<TDatum>;
    /** The key to use to retrieve close values from the data. */
    closeKey: DatumKey<TDatum>;
}

export interface AgHlcSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of high values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    highName?: string;
    /** A human-readable description of low values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    lowName?: string;
    /** A human-readable description of close values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    closeName?: string;
    /** A human-readable description of the series. If supplied, this will be shown in the legend and the default tooltip. */
    yName?: string;
    /** Human-readable description of the series. If supplied, matching items with the same value will be toggled together. */
    legendItemName?: string;
}

export interface AgHlcSeriesBandStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Styling for the markers on this edge. */
    marker?: AgSeriesMarkerStyle;
}

export interface AgHlcSeriesLineStyle extends StrokeOptions, LineDashOptions {
    /** Styling for the markers on this line. */
    marker?: AgSeriesMarkerStyle;
}

export interface AgHlcSeriesStyleItems {
    /** Styling for the band from close to high, and for the high edge. */
    high?: AgHlcSeriesBandStyle;
    /** Styling for the band from low to close, and for the low edge. */
    low?: AgHlcSeriesBandStyle;
    /** Styling for the close line. */
    close?: AgHlcSeriesLineStyle;
}

export interface AgHlcSeriesStyle {
    /** Styling for the bands, edges and close line. */
    item?: AgHlcSeriesStyleItems;
}

export interface AgHlcSeriesStylerParams<TDatum, TContext>
    extends
        SeriesCallbackParams<HighlightState, SelectionState>,
        ContextCallbackParams<TContext>,
        AgHlcSeriesOptionsKeys<TDatum>,
        Required<AgHlcSeriesStyle> {}

export interface AgHlcSeriesItemStylerParams<TDatum, TContext>
    extends
        AgHlcSeriesOptionsKeys<TDatum>,
        DatumItemCallbackParams<AgHlcSeriesItemType, TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        Required<AgSeriesMarkerStyle> {
    /** The value the marker represents. This can be `high`, `low` or `close`. */
    itemType: AgHlcSeriesItemType;
}

export interface AgHlcSeriesTooltipRendererParams<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgCartesianSeriesTooltipRendererParams<TDatum, TContext>, 'xKey' | 'xName' | 'yKey' | 'yName'>,
        AgHlcSeriesOptionsKeys<TDatum>,
        AgHlcSeriesOptionsNames,
        Omit<AgSeriesMarkerStyle, 'shape'> {
    /** The value the hovered item represents. This can be `high`, `low` or `close`. */
    itemType: AgHlcSeriesItemType;
}

export interface AgHlcMarker<TDatum, TContext> extends AgSeriesMarkerOptions<
    TDatum,
    AgHlcSeriesItemStylerParams<TDatum, TContext>,
    TContext
> {
    /** Function used to return formatting for individual markers, based on the supplied information. */
    itemStyler?: Styler<AgHlcSeriesItemStylerParams<TDatum, TContext>, AgSeriesMarkerStyle>;
}

export interface AgHlcSeriesItemMarker<TDatum, TContext> extends Omit<
    AgSeriesMarkerOptions<TDatum, never, TContext>,
    'itemStyler'
> {}

export interface AgHlcSeriesItemLineThemeableOptions<TDatum, TContext> extends StrokeOptions, LineDashOptions {
    /** Styling configuration for the markers on this line. */
    marker?: AgHlcSeriesItemMarker<TDatum, TContext>;
}

export interface AgHlcSeriesItemBandThemeableOptions<TDatum, TContext>
    extends FillOptions, AgHlcSeriesItemLineThemeableOptions<TDatum, TContext> {}

export interface AgHlcSeriesItemThemeableOptions<TDatum, TContext> {
    /** Configuration for the band from close to high, and for the high edge. */
    high?: AgHlcSeriesItemBandThemeableOptions<TDatum, TContext>;
    /** Configuration for the band from low to close, and for the low edge. */
    low?: AgHlcSeriesItemBandThemeableOptions<TDatum, TContext>;
    /** Configuration for the close line. */
    close?: AgHlcSeriesItemLineThemeableOptions<TDatum, TContext>;
}

export interface AgHlcSeriesThemeableOptions<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgBaseCartesianThemeableOptions<TDatum, TContext> {
    /** Configuration for the markers used in the series. Markers are shared by the high, low and close values unless overridden in `item`. */
    marker?: AgHlcMarker<TDatum, TContext>;
    /** Configuration for the bands, edges and close line. */
    item?: AgHlcSeriesItemThemeableOptions<TDatum, TContext>;
    /** The type of interpolation used for the edges and close line. */
    interpolation?: AgInterpolationType;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgHlcSeriesTooltipRendererParams<TDatum, TContext>>;
    /** Set to `true` to connect across missing data points. */
    connectMissingData?: boolean;
    /** Function used to return formatting for the entire series, based on the given parameters. */
    styler?: Styler<AgHlcSeriesStylerParams<TDatum, TContext>, AgHlcSeriesStyle>;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesHighlightOptions<AgHighlightStyleOptions, AgHighlightStyleOptions>;
}

export interface AgHlcSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlight'>,
        AgBaseCartesianSeriesAxisOptions,
        AgHlcSeriesOptionsKeys<TDatum>,
        AgHlcSeriesOptionsNames,
        AgHlcSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the HLC Series. */
    type: 'hlc';
}
