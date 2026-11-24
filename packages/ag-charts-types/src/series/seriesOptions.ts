import type { AgDropShadowOptions, AgGlowOptions } from '../chart/dropShadowOptions';
import type { AgSeriesListeners } from '../chart/eventOptions';
import type { AgSelectionOptions, AgSelectionStyleOptions } from '../chart/selectionOptions';
import type { AxisValue, ContextDefault, DatumDefault, InteractionRange, Opacity, PixelSize } from '../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from './cartesian/commonOptions';

export interface AgMultiSeriesHighlightOptions<
    ItemHighlightStyleOptions,
    SeriesHighlightStyleOptions = ItemHighlightStyleOptions,
> extends AgHighlightOptions<ItemHighlightStyleOptions> {
    /** Options for the highlighted series. */
    highlightedSeries?: SeriesHighlightStyleOptions;
    /**
     * Options for the un-highlighted series when there is an active highlight.
     *
     * Default: `{ opacity: 0.5 }`. `0.3` for line, area, scatter, bubble, candlestick, OHLC, HLC, range area, radar line, radar area and map marker; `0.2` for map line; unset for waterfall, heatmap and the funnel family
     */
    unhighlightedSeries?: SeriesHighlightStyleOptions;
    /** Show this series in front when highlighted.
     *
     * Default: `true`. `false` for nightingale and map shape
     */
    bringToFront?: boolean;
}

/** Highlight style options for an item that can cast a `glow`. */
export interface AgGlowHighlightStyleOptions {
    /**
     * Configuration for the glow around the item while this highlight state applies. It is merged, field by field, over
     * the `glow` of the series.
     *
     * Default: the `glow` of the series
     */
    glow?: AgGlowOptions;
}

/** Highlight style options for the highlighted item of a series whose items can cast a `shadow`. */
export interface AgShadowHighlightStyleOptions {
    /**
     * Configuration for the shadow of the highlighted item. It is merged, field by field, over the `shadow` of the series.
     *
     * Default: the `shadow` of the series
     */
    shadow?: Omit<AgDropShadowOptions, 'color'>;
}

/** Highlight options for a series whose items can cast a `glow`, and whose highlighted item can cast a `shadow`. */
export interface AgGlowHighlightOptions<ItemHighlightStyleOptions = AgHighlightStyleOptions> extends AgHighlightOptions<
    ItemHighlightStyleOptions & AgGlowHighlightStyleOptions
> {
    /**
     * Options for the highlighted item.
     *
     * Default: `{ glow: { enabled: true } }`. The item does not glow for cone funnel, sankey and chord
     */
    highlightedItem?: ItemHighlightStyleOptions & AgGlowHighlightStyleOptions & AgShadowHighlightStyleOptions;
}

/** Highlight options for a series whose items can cast a `glow`, with separate options for the highlighted series. */
export interface AgMultiSeriesGlowHighlightOptions<
    ItemHighlightStyleOptions,
    SeriesHighlightStyleOptions = ItemHighlightStyleOptions,
> extends AgMultiSeriesHighlightOptions<
    ItemHighlightStyleOptions & AgGlowHighlightStyleOptions,
    SeriesHighlightStyleOptions & AgGlowHighlightStyleOptions
> {
    /**
     * Options for the highlighted item.
     *
     * Default: `{ glow: { enabled: true } }`. The item does not glow for cone funnel, sankey and chord
     */
    highlightedItem?: ItemHighlightStyleOptions & AgGlowHighlightStyleOptions & AgShadowHighlightStyleOptions;
}

export interface AgHighlightOptions<ItemHighlightStyleOptions = AgHighlightStyleOptions> {
    /** Set to `false` to disable highlighting. */
    enabled?: boolean;
    /**
     * Options for the highlighted item.
     *
     * Default: unset. `{ stroke: <the theme's accent colour>, strokeWidth: 2 }` for organization
     */
    highlightedItem?: ItemHighlightStyleOptions;
    /**
     * Options for the un-highlighted items when there is an active highlight.
     *
     * Default: `{ opacity: 1 }`. `0.5` for pie and donut; `0.3` for sankey and chord; `0.6` for map line; unset for map shape, sunburst, treemap and organization.
     * When `highlight.mode` is `'shared'`, the opacity of `unhighlightedSeries` for every series that has that option except map shape
     */
    unhighlightedItem?: ItemHighlightStyleOptions;
}
export interface AgHighlightStyleOptions extends AgBaseHighlightStyleOptions, FillOptions {}

export interface AgMarkerHighlightSizeOptions {
    /**
     * The size in pixels of the markers while this highlight state applies.
     *
     * Default: the size of the marker outside a highlight
     */
    size?: PixelSize;
}

export interface AgMarkerHighlightStyleOptions extends AgHighlightStyleOptions, AgMarkerHighlightSizeOptions {}

export interface AgBaseHighlightStyleOptions extends StrokeOptions, LineDashOptions {
    /** The opacity of the whole series (line, fill, labels and markers, if any) */
    opacity?: Opacity;
}

export interface AgBaseSeriesThemeableOptions<TDatum, TContext = ContextDefault> {
    /** The cursor to use for hovered markers. This config is identical to the CSS `cursor` property. */
    cursor?: string;
    /** Context object to use in callbacks. */
    context?: TContext;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgHighlightOptions<AgHighlightStyleOptions>;
    /** Configuration for data selection. */
    selection?: AgSelectionOptions<AgSelectionStyleOptions, AgSelectionStyleOptions>;
    /** Range from a node that a click triggers the listener. */
    nodeClickRange?: InteractionRange;
    /** Whether to include the series in the legend. */
    showInLegend?: boolean;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<TDatum, TContext>;
}

export interface AgBaseCartesianThemeableOptions<
    TDatum,
    TContext = ContextDefault,
> extends AgBaseSeriesThemeableOptions<TDatum, TContext> {
    /** Whether to include the series in the Mini Chart. */
    showInMiniChart?: boolean;
}

export interface AgSeriesSegmentation<SegmentOptions = AgSeriesShapeSegmentOptions> {
    /** Whether segmentation is enabled. */
    enabled?: boolean;
    /** The axis key used for segmentation. */
    key: 'x' | 'y';
    /** Configuration for each segment. */
    segments: SegmentOptions[];
}

export interface AgSeriesLineSegmentOptions extends StrokeOptions, LineDashOptions {
    /** The axis value at which the styles should start. This is the start of the axis domain by default. */
    start?: AxisValue;
    /** The axis value at which the styles should stop. This is the end of the axis domain by default. */
    stop?: AxisValue;
}

export interface AgSeriesShapeSegmentOptions extends AgSeriesLineSegmentOptions, FillOptions {}

export interface AgBaseSeriesOptions<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgBaseSeriesThemeableOptions<TDatum, TContext> {
    /**
     * Primary identifier for the series. This is provided as `seriesId` in user callbacks to differentiate multiple series. Auto-generated ids are subject to future change without warning, if your callbacks need to vary behaviour by series please supply your own unique `id` value.
     *
     * Default: `auto-generated value`
     */
    id?: string;
    /** Context object to use in callbacks. */
    context?: TContext;
    /** The data to use when rendering the series. If this is not supplied, data must be set on the chart instead. */
    data?: TDatum[];
    /** Whether to display the series. */
    visible?: boolean;
    /**
     * Position of the series in the keyboard focus order within other series.
     * Series with a lower value are focused first, instead of the declared order in the `series` array.
     *
     */
    focusIndex?: number;
}
