import type { ContextCallbackParams, DatumCallbackParams, HighlightState, Styler } from '../../chart/callbackOptions';
import type { AgChartLabelFitOptions, AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { ContextDefault, CssColor, DatumDefault, PixelSize, Ratio } from '../../chart/types';
import type { AgColorType, FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgChordSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'selection'>,
        AgChordSeriesOptionsKeys,
        AgChordSeriesOptionsNames,
        AgChordSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Chord Series. */
    type: 'chord';
    /**
     * A callback to provide a stable identifier for each node, exposed as `itemId` in events and active state.
     *
     * The returned identifier must be unique across nodes and links, which share one `itemId` namespace
     * (links default to `link-<index>`).
     *
     * If not supplied, the node name is used as its identifier.
     */
    getItemId?: (params: AgChordSeriesGetItemIdParams<TDatum, TContext>) => string;
}

export interface AgChordSeriesGetItemIdParams<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends ContextCallbackParams<TContext> {
    /** The name of the node, derived from the `fromKey`/`toKey` values or the supplied `nodes`. */
    nodeName: string;
    /** The index of the node, in the order nodes are first encountered. Not a stable identifier. */
    index: number;
    /** The node datum, or an empty object for nodes derived implicitly from link data. */
    datum: TDatum;
}

export interface AgChordSeriesLinkItemStylerParams<TDatum, TContext = ContextDefault>
    extends
        DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgChordSeriesOptionsKeys,
        Required<AgChordSeriesLinkStyle> {}

export interface AgChordSeriesNodeItemStylerParams<TDatum, TContext = ContextDefault>
    extends
        DatumCallbackParams<TDatum, HighlightState>,
        ContextCallbackParams<TContext>,
        AgChordSeriesOptionsKeys,
        Required<AgChordSeriesNodeStyle> {
    /** Label of the node. */
    label: string | undefined;
    /** Size of the node. */
    size: number;
}

export interface AgChordSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault> extends Omit<
    AgBaseSeriesThemeableOptions<TDatum, TContext>,
    'selection'
> {
    /** Options for the label for each node. */
    label?: AgChordSeriesLabelOptions<TDatum, TContext>;
    /** The colours to cycle through for the fills of the nodes and links. An array of colour strings, or fill objects for gradients, patterns, or images. */
    fills?: AgColorType[];
    /** The colours to cycle through for the strokes of the nodes and links. */
    strokes?: CssColor[];
    /** Options for the links. */
    link?: AgChordSeriesLinkOptions<TDatum, TContext>;
    /** Options for the nodes. */
    node?: AgChordSeriesNodeOptions<TDatum, TContext>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgChordSeriesTooltipRendererParams<TDatum, TContext>>;
}

export interface AgChordSeriesLabelOptions<TDatum, TContext = ContextDefault>
    extends AgChartLabelOptions<TDatum, AgChordSeriesLabelFormatterParams<TDatum>, TContext>, AgChartLabelFitOptions {
    /** Spacing between a node and its label. */
    spacing?: PixelSize;
}

export interface AgChordSeriesLinkStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Tension of the links. 0 gives a maximally curved link, and 1 gives a straight line. */
    tension?: Ratio;
}

export interface AgChordSeriesLinkOptions<TDatum, TContext = ContextDefault> extends AgChordSeriesLinkStyle {
    /** Function used to return formatting for individual links, based on the given parameters.*/
    itemStyler?: Styler<AgChordSeriesLinkItemStylerParams<TDatum, TContext>, AgChordSeriesLinkStyle>;
}

export interface AgChordSeriesNodeStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgChordSeriesNodeOptions<TDatum, TContext = ContextDefault> extends AgChordSeriesNodeStyle {
    /** Minimum spacing between the nodes. */
    spacing?: PixelSize;
    /** Width of the nodes. */
    width?: PixelSize;
    /** Function used to return formatting for individual nodes, based on the given parameters.*/
    itemStyler?: Styler<AgChordSeriesNodeItemStylerParams<TDatum, TContext>, AgChordSeriesNodeStyle>;
}

export interface AgChordSeriesOptionsKeys {
    /** The key containing the start node of each link. */
    fromKey?: string;
    /** The key containing the end node of each link. */
    toKey?: string;
    /** The key containing the size of each link. */
    sizeKey?: string;
}

export interface AgChordSeriesOptionsNames {
    /** A human-readable description of the size values.
     * If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    sizeName?: string;
}

interface SizeParams {
    /** Size of the link, or the computed size of the node. */
    size: number;
}

export interface AgChordSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends
        AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgChordSeriesOptionsKeys,
        AgChordSeriesOptionsNames,
        SizeParams,
        FillOptions,
        StrokeOptions,
        LineDashOptions {}

export interface AgChordSeriesLabelFormatterParams<_TDatum = DatumDefault>
    extends AgChordSeriesOptionsKeys, SizeParams {}
