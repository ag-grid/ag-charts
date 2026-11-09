import type { AgGlowOptions } from '../chart/dropShadowOptions';
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
     * Configuration for the glow around the item while this highlight state applies. It is merged, field by field, over
     * the `glow` of the series (`marker.glow` for the series that glow on their markers), so a state only needs to set
     * what differs. A state with no `glow` has the glow of the series, on or off, and a state's `glow` with no `enabled`
     * turns it on. Where the series has a `glow` on more than one part (sankey and chord nodes and links, waterfall items,
     * HLC and range area markers), a state with no `glow` leaves each part its own, and a state's `glow` applies to every part.
     *
     * Where a state has more than one `glow` to fall back to, the first applies: `highlightedItem` falls back to
     * `highlightedSeries`, then to the `glow` of the series. `unhighlightedItem` also falls back to `highlightedSeries`,
     * as its items are in the highlighted series, and `unhighlightedSeries` to the `glow` of the series.
     *
     * Treemap and sunburst don't support a series-level `glow` yet. Their `highlightedBranch` and `unhighlightedBranch`
     * states take the place of the series states, treemap groups have only the item states, and the `glow` of a state
     * replaces the `shadow` of the item while it applies, rather than being cast alongside it.
     *
     * The glow of the hovered item (`highlightedItem`) is drawn centred on the item, with the item drawn over its own
     * glow. It sits above every series when `bringToFront` is on, and keeps its series' stacking order otherwise. The glow
     * of the highlighted series (`highlightedSeries`, and `unhighlightedItem` as it falls back to it) is drawn behind the
     * items of that series, which `bringToFront` puts above the other series; with `bringToFront` off it stays behind the
     * series drawn after it. It never covers an item of its own series. The glow of an item at rest, and the glow of
     * `unhighlightedSeries`, stay behind every series, and are drawn together with the `shadow`: an item can cast both.
     *
     * Line, radar line and HLC series glow only on their markers (`marker.glow`), and area, radar area and range area
     * fills are not redrawn when highlighted, so only their markers glow. Cone funnel series do not have this option.
     *
     * Default: the `glow` of the series (none on treemap and sunburst)
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
