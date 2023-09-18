import type { AgSeriesListeners } from '../options/eventOptions';
import type { CssColor, InteractionRange, MarkerShape, Opacity, PixelSize } from '../options/types';

export interface AgSeriesHighlightMarkerStyle {
    /** The fill colour of a marker when tapped or hovered over. Use `undefined` for no highlight. */
    fill?: CssColor;
    /** The opacity of the fill for the highlighted item. */
    fillOpacity?: Opacity;
    /** The stroke colour of a marker when tapped or hovered over. Use `undefined` for no highlight. */
    stroke?: CssColor;
    /** The stroke width of a marker when tapped or hovered over. Use `undefined` for no highlight. */
    strokeWidth?: PixelSize;
}

export interface AgSeriesHighlightSeriesStyle {
    enabled?: boolean;
    /** The opacity of the whole series (area line, area fill, labels and markers, if any) when another chart series or another stack level in the same area series is highlighted by hovering a data point or a legend item. Use `undefined` or `1` for no dimming. */
    dimOpacity?: Opacity;
    /** The stroke width of the area line when one of the markers is tapped or hovered over, or when a tooltip is shown for a data point, even when series markers are disabled. Use `undefined` for no highlight. */
    strokeWidth?: PixelSize;
}

export interface AgSeriesHighlightStyle {
    /** Highlight style used for an individual marker when tapped or hovered over. */
    item?: AgSeriesHighlightMarkerStyle;
    /** Highlight style used for whole series when one of its markers is tapped or hovered over. */
    series?: AgSeriesHighlightSeriesStyle;
}

export interface AgBaseSeriesThemeableOptions {
    /** Whether to include the series in the legend. */
    showInLegend?: boolean;
    /** The cursor to use for hovered markers. This config is identical to the CSS `cursor` property. */
    cursor?: string;
    /** Configuration for series markers and series line highlighting when a marker / data point or a legend item is hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Range from a node a click triggers the listener. */
    nodeClickRange?: InteractionRange;
}

export interface AgBaseSeriesOptions<DatumType> extends AgBaseSeriesThemeableOptions {
    /**
     * Primary identifier for the series. This is provided as `seriesId` in user callbacks to differentiate multiple
     * series. Auto-generated ids are subject to future change without warning, if your callbacks need to vary behaviour
     * by series please supply your own unique `id` value.
     *
     * Default: auto-generated value
     */
    id?: string;
    /** The data to use when rendering the series. If this is not supplied, data must be set on the chart instead. */
    data?: DatumType[];
    /** Whether to display the series. */
    visible?: boolean;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}

export interface AgSeriesMarker {
    /** Whether or not to show markers. */
    enabled?: boolean;
    /** The shape to use for the markers. You can also supply a custom marker by providing a `Marker` subclass. */
    shape?: MarkerShape;
    /** The size in pixels of the markers. */
    size?: PixelSize;
    /** The colour to use for marker fills. If this is not specified, the markers will take their fill from the series. */
    fill?: CssColor;
    /** Opacity of the marker fills. */
    fillOpacity?: Opacity;
    /** The colour to use for marker strokes. If this is not specified, the markers will take their stroke from the series. */
    stroke?: CssColor;
    /** The width in pixels of the marker stroke. If this is not specified, the markers will take their stroke width from the series. */
    strokeWidth?: PixelSize;
    /** Opacity of the marker strokes. */
    strokeOpacity?: Opacity;
}

export interface AgSeriesMarkerFormatterParams<DatumType> {
    datum: DatumType;
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth: PixelSize;
    size: number;
    highlighted: boolean;
    seriesId: string;
}
