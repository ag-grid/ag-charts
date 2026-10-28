import type { AgGlowOptions } from '../chart/dropShadowOptions';
import type { AgSeriesListeners } from '../chart/eventOptions';
import type { AgSelectionOptions, AgSelectionStyleOptions } from '../chart/selectionOptions';
import type { AxisValue, ContextDefault, DatumDefault, InteractionRange, Opacity } from '../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from './cartesian/commonOptions';

export interface AgMultiSeriesHighlightOptions<
    ItemHighlightStyleOptions,
    SeriesHighlightStyleOptions = ItemHighlightStyleOptions,
> extends AgHighlightOptions<ItemHighlightStyleOptions> {
    /** Options for the highlighted series. */
    highlightedSeries?: SeriesHighlightStyleOptions;
    /** Options for the un-highlighted series when there is an active highlight. */
    unhighlightedSeries?: SeriesHighlightStyleOptions;
    /** Show this series in front when highlighted.
     *
     * Default: `true`
     */
    bringToFront?: boolean;
}

/** Highlight style options for an item that can cast a `glow`. */
export interface AgGlowHighlightStyleOptions {
    /**
     * Configuration for the glow around the item while this highlight state applies.
     *
     * The hovered item's glow (`highlightedItem`) is drawn centred on the item, with the item drawn over its own glow.
     * It sits above every series when `bringToFront` is on, and keeps its series' stacking order otherwise. The glow of
     * every other state (`unhighlightedItem`, `unhighlightedSeries`, and the other items under `highlightedSeries`; on
     * treemap and sunburst, `highlightedBranch` and `unhighlightedBranch`) is cast in the same pass as the item's
     * `shadow`, so it stays behind every series.
     *
     * While a glow is enabled for an item's state it replaces that item's `shadow`; the two are never merged. The
     * hovered item's own `shadow` stays beneath its glow. Series with a series-level bucket (`highlightedSeries`,
     * `unhighlightedSeries`) fall back to it: both `highlightedItem` and `unhighlightedItem` fall back to
     * `highlightedSeries`, so its glow also lights the other items of the hovered series, and `highlightedItem.glow` is
     * merged over it field by field. On treemap and sunburst the branch buckets take the place of the series buckets,
     * except for treemap groups, which have only the item buckets.
     *
     * Line series glow only on their markers, and area, radar area and range area fills are not redrawn when
     * highlighted, so only their markers glow. Cone funnel series do not have this option.
     *
     * Default: no glow
     */
    glow?: AgGlowOptions;
}

/** Highlight options for a series whose items can cast a `glow`. */
export interface AgGlowHighlightOptions<ItemHighlightStyleOptions = AgHighlightStyleOptions> extends AgHighlightOptions<
    ItemHighlightStyleOptions & AgGlowHighlightStyleOptions
> {}

/** Highlight options for a series whose items can cast a `glow`, with separate options for the highlighted series. */
export interface AgMultiSeriesGlowHighlightOptions<
    ItemHighlightStyleOptions,
    SeriesHighlightStyleOptions = ItemHighlightStyleOptions,
> extends AgMultiSeriesHighlightOptions<
    ItemHighlightStyleOptions & AgGlowHighlightStyleOptions,
    SeriesHighlightStyleOptions & AgGlowHighlightStyleOptions
> {}

export interface AgHighlightOptions<ItemHighlightStyleOptions = AgHighlightStyleOptions> {
    /** Set to `false` to disable highlighting. */
    enabled?: boolean;
    /** Options for the highlighted item.  */
    highlightedItem?: ItemHighlightStyleOptions;
    /** Options for the un-highlighted items when there is an active highlight. */
    unhighlightedItem?: ItemHighlightStyleOptions;
}
export interface AgHighlightStyleOptions extends AgBaseHighlightStyleOptions, FillOptions {}

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
     * Position of the series in the keyboard focus order within the series area. Series with a lower value are focused first, and series with the same value follow their order in the `series` array.
     *
     * Series without a `focusIndex` are focused after those with one, in `series` array order.
     */
    focusIndex?: number;
}
