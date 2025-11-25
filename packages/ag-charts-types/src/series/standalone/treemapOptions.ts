import type {
    ContextCallbackParams,
    DatumCallbackParams,
    HierarchyHighlightState,
    Styler,
} from '../../chart/callbackOptions';
import type {
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    AgChartLabelOptions,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type {
    ContextDefault,
    CssColor,
    DatumDefault,
    Opacity,
    PixelSize,
    TextAlign,
    VerticalAlign,
} from '../../chart/types';
import type { AgColorType, FillOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export type AgTreemapHighlightState = HierarchyHighlightState;

export interface AgTreemapSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgTreemapSeriesOptionsKeys,
        AgTreemapSeriesOptionsNames,
        FillOptions,
        StrokeOptions {
    /** The depth of the datum in the hierarchy. */
    depth: number;
}

export interface AgTreemapSeriesGroupStyle extends FillOptions, StrokeOptions {}

export interface AgTreemapSeriesGroupLabelOptions<TDatum, TContext = ContextDefault>
    extends AgChartLabelOptions<TDatum, AgTreemapSeriesLabelFormatterParams<TDatum>, TContext> {
    /** The distance between the tiles and the title. */
    spacing?: PixelSize;
}

export interface AgTreemapSeriesGroupLayout<TDatum, TContext = ContextDefault> {
    /** Options for the label in a group. */
    label?: AgTreemapSeriesGroupLabelOptions<TDatum, TContext>;
    /** Horizontal position of the label. */
    textAlign?: TextAlign;
    /** The distance between the edges of the outer-most title to the edges of the group. */
    padding?: PixelSize;
    /** Gap between adjacent groups. */
    gap?: PixelSize;
    /** Whether the group can be highlighted. */
    interactive?: boolean;
}

export interface AgTreemapSeriesGroupOptions<TDatum, TContext = ContextDefault>
    extends AgTreemapSeriesGroupStyle,
        AgTreemapSeriesGroupLayout<TDatum, TContext> {
    /** Apply rounded corners to each group. */
    cornerRadius?: PixelSize;
    /** Highlight overrides for groups. */
    highlight?: AgTreemapSeriesGroupHighlightOptions;
}

export interface AgTreemapSeriesTileStyle extends FillOptions, StrokeOptions {}

export interface AgTreemapSeriesTileLayout<TDatum, TContext = ContextDefault> {
    /** Options for the label in a tile. */
    label?: AgChartAutoSizedLabelOptions<TDatum, AgTreemapSeriesLabelFormatterParams<TDatum>, TContext>;
    /** Options for a secondary, smaller label in a tile - displayed under the primary label. */
    secondaryLabel?: AgChartAutoSizedSecondaryLabelOptions<
        TDatum,
        AgTreemapSeriesLabelFormatterParams<TDatum>,
        TContext
    >;
    /** Horizontal position of the label. */
    textAlign?: TextAlign;
    /** Vertical position of the label. */
    verticalAlign?: VerticalAlign;
    /** Distance between the tile edges and the text. */
    padding?: PixelSize;
    /** Gap between adjacent tile. */
    gap?: PixelSize;
}

export interface AgTreemapSeriesTileHighlightStyle extends AgTreemapSeriesTileStyle {
    /** Opacity to apply to the tile and its labels. */
    opacity?: Opacity;
}

export interface AgTreemapSeriesTileHighlightOptions {
    /** Style for tiles within the hovered branch. */
    highlightedBranch?: AgTreemapSeriesTileHighlightStyle;
    /** Style for the directly hovered tile. */
    highlightedItem?: AgTreemapSeriesTileHighlightStyle;
    /** Style for other tiles within the hovered branch. */
    unhighlightedItem?: AgTreemapSeriesTileHighlightStyle;
    /** Style for tiles outside of the hovered branch. */
    unhighlightedBranch?: AgTreemapSeriesTileHighlightStyle;
}

export interface AgTreemapSeriesGroupHighlightStyle extends FillOptions, StrokeOptions {
    /** Opacity to apply to the group tile and its child tiles. */
    opacity?: Opacity;
}

export interface AgTreemapSeriesGroupHighlightOptions {
    /** Style for the hovered group. */
    highlightedItem?: AgTreemapSeriesGroupHighlightStyle;
    /** Style for groups that are not hovered when another group is active. */
    unhighlightedItem?: AgTreemapSeriesGroupHighlightStyle;
}

export interface AgTreemapSeriesTileOptions<TDatum, TContext = ContextDefault>
    extends AgTreemapSeriesTileStyle,
        AgTreemapSeriesTileLayout<TDatum, TContext> {
    /** Apply rounded corners to each tile. */
    cornerRadius?: PixelSize;
    /** Highlight overrides for tiles. */
    highlight?: AgTreemapSeriesTileHighlightOptions;
}

export interface AgTreemapSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgBaseSeriesThemeableOptions<TDatum, TContext>, 'highlight' | 'showInLegend'> {
    /** The colours to cycle through for the fills of the groups and tiles. */
    fills?: AgColorType[];
    /** The colours to cycle through for the strokes of the groups and tiles. */
    strokes?: CssColor[];
    /** The colour range to interpolate the numeric colour domain (min and max `colorKey` values) into. */
    colorRange?: CssColor[];
    /** Options for group nodes (i.e. nodes WITH children). */
    group?: AgTreemapSeriesGroupOptions<TDatum, TContext>;
    /** Options for leaf nodes (i.e. nodes WITHOUT children). */
    tile?: AgTreemapSeriesTileOptions<TDatum, TContext>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgTreemapSeriesTooltipRendererParams<TDatum, TContext>>;
    /** A callback function for adjusting the styles of a particular tile based on the input parameters. */
    itemStyler?: Styler<AgTreemapSeriesItemStylerParams<TDatum, TContext>, AgTreemapSeriesStyle>;
}

export interface AgTreemapSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlight' | 'highlightStyle' | 'showInLegend'>,
        AgTreemapSeriesOptionsKeys,
        AgTreemapSeriesOptionsNames,
        AgTreemapSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Treemap Series. */
    type: 'treemap';
}

export interface AgTreemapSeriesOptionsKeys {
    /** The name of the node key containing the label. */
    labelKey?: string;
    /** The name of the node key containing a secondary label. */
    secondaryLabelKey?: string;
    /** The name of the node key containing the children. Defaults to `children`. */
    childrenKey?: string;
    /** The name of the node key containing the size value. */
    sizeKey?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the tile colour. */
    colorKey?: string;
}

export interface AgTreemapSeriesOptionsNames {
    /** A human-readable description of the size values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    sizeName?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
}

/** The parameters of the Treemap series formatter function. */
export interface AgTreemapSeriesItemStylerParams<TDatum, TContext = ContextDefault>
    extends DatumCallbackParams<TDatum, AgTreemapHighlightState>,
        ContextCallbackParams<TContext>,
        AgTreemapSeriesOptionsKeys,
        AgTreemapSeriesStyle {
    /** The depth of the datum in the hierarchy. */
    depth: number;
}

export interface AgTreemapSeriesLabelFormatterParams<_TDatum = DatumDefault>
    extends AgTreemapSeriesOptionsKeys,
        AgTreemapSeriesOptionsNames {
    /** The depth of the datum in the hierarchy. */
    depth: number;
}

/** The formatted style of a Treemap tile. */
export interface AgTreemapSeriesStyle extends FillOptions, StrokeOptions {}
