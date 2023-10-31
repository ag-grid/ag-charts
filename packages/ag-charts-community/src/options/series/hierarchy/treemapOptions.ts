import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelFormatterParams, AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize, TextWrap } from '../../chart/types';
import type { FillOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgTreemapSeriesLabelOptions<TDatum> extends AgChartLabelOptions<TDatum, AgTreemapSeriesOptionsKeys> {
    /** The amount of the tile's vertical space to reserve for the label. */
    padding?: number;
}

export interface AgTreemapSeriesTooltipRendererParams<TDatum>
    extends AgChartCallbackParams<TDatum>,
        AgTreemapSeriesOptionsKeys {
    /** The parent of the datum from the treemap data. */
    parent?: TDatum;
    /** The depth of the datum in the hierarchy. */
    depth: number;
    /** The computed fill colour of the treemap tile. */
    color?: string;
    /** The title of the treemap tile */
    title?: string;
}

export interface AgTreemapSeriesTileLabelOptions<TDatum>
    extends AgChartLabelOptions<TDatum, AgTreemapSeriesOptionsKeys> {
    /**
     * Text wrapping strategy for treemap labels.
     * `'always'` will always wrap text to fit within the tile.
     * `'hyphenate'` is similar to `'always'`, but inserts a hyphen (`-`) if forced to wrap in the middle of a word.
     * `'on-space'` will only wrap on white space. If there is no possibility to wrap a line on space and satisfy the tile dimensions, the text will be truncated.
     * `'never'` disables text wrapping.
     * Default: `'on-space'`
     */
    wrapping?: TextWrap;
}

export interface AgTreemapSeriesValueLabelOptions<TDatum> {
    /** A property to be used as a key to retrieve a value from datum. */
    key?: string;
    /** A name of a datum value. */
    name?: string;
    /** A function to generate a value label from datum. */
    formatter?: (params: AgChartLabelFormatterParams<TDatum>) => string;
    /** The label's font and color style. */
    style?: AgChartLabelOptions<TDatum, AgTreemapSeriesOptionsKeys>;
}

export interface AgTreemapSeriesLabelsOptions<TDatum> {
    /** The label configuration for the large leaf tiles. */
    large?: AgTreemapSeriesTileLabelOptions<TDatum>;
    /** The label configuration for the medium-sized leaf tiles. */
    medium?: AgTreemapSeriesTileLabelOptions<TDatum>;
    /** The label configuration for the small leaf tiles. */
    small?: AgTreemapSeriesTileLabelOptions<TDatum>;
    /** A function to generate a label/title for the cell. */
    formatter?: (params: AgChartLabelFormatterParams<TDatum>) => string;
    /** The configuration for the cell value label. */
    value?: AgTreemapSeriesValueLabelOptions<TDatum>;
}

export interface AgTreemapSeriesHighlightTextStyle {
    /** The colour of an item's text when tapped or hovered over. Use `undefined` for no highlight. */
    color?: CssColor;
}

export interface AgTreemapSeriesHighlightStyle extends AgSeriesHighlightStyle {
    /** Highlight style used for a text when item is tapped or hovered over. */
    text?: AgTreemapSeriesHighlightTextStyle;
}

export interface AgTreemapSeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions {
    /** The label configuration for the top-level tiles. */
    title?: AgTreemapSeriesLabelOptions<TDatum>;
    /** The label configuration for the children of the top-level parent tiles. */
    subtitle?: AgTreemapSeriesLabelOptions<TDatum>;
    /** Configuration for the tile labels. */
    labels?: AgTreemapSeriesLabelsOptions<TDatum>;
    /** The domain the 'colorKey' values belong to. The domain can contain more than two stops, for example `[-5, 0, -5]`. In that case the 'colorRange' should also use a matching number of colors. */
    colorDomain?: number[];
    /** The color range to interpolate the numeric `colorDomain` into. For example, if the `colorDomain` is `[-5, 5]` and `colorRange` is `['red', 'green']`, a `colorKey` value of `-5` will be assigned the 'red' color, `5` - 'green' color and `0` a blend of 'red' and 'green'. */
    colorRange?: string[];
    /** The group fill color. If undefined the value based on `colorKey` will be used. */
    groupFill?: string;
    /** The group's stroke color. */
    groupStroke?: string;
    /** The group's stroke width. */
    groupStrokeWidth?: number;
    /** The tile's stroke color. */
    tileStroke?: string;
    /** The tile's stroke width. */
    tileStrokeWidth?: number;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgTreemapSeriesTooltipRendererParams<TDatum>>;
    /**
     * The amount of padding in pixels inside of each treemap tile.
     * Default: `20`
     */
    nodePadding?: PixelSize;
    /**
     * The amount of gap in pixels between treemap tiles.
     * Default: `0`
     */
    nodeGap?: PixelSize;
    /** Configuration for the shadow used behind the treemap tiles. */
    tileShadow?: AgDropShadowOptions;
    /** Configuration for the shadow used behind the treemap labels. */
    labelShadow?: AgDropShadowOptions;
    /** Determines whether the groups will be highlighted by cursor. */
    highlightGroups?: boolean;
    /** Configuration for treemap tiles when they are hovered over. */
    highlightStyle?: AgTreemapSeriesHighlightStyle;
    /** A callback function for adjusting the styles of a particular treemap tile based on the input parameters */
    formatter?: (params: AgTreemapSeriesFormatterParams<TDatum>) => AgTreemapSeriesStyle;
}

/** Configuration for the treemap series. */
export interface AgTreemapSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgTreemapSeriesOptionsKeys,
        AgTreemapSeriesThemeableOptions<TDatum> {
    type: 'treemap';
}

export interface AgTreemapSeriesOptionsKeys {
    /** The name of the node key containing the label. */
    labelKey?: string;
    /** The name of the node key containing the size value. */
    sizeKey?: string;
    /** The name of the node key containing the color value. This value (along with `colorDomain` and `colorRange` configs) will be used to determine the tile color. */
    colorKey?: string;
}

/** The parameters of the treemap series formatter function */
export interface AgTreemapSeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgTreemapSeriesOptionsKeys,
        AgTreemapSeriesStyle {
    /** The parent of the datum from the treemap data. */
    readonly parent?: TDatum;
    /** The depth of the datum in the hierarchy. */
    readonly depth: number;
    /** `true` if the tile is highlighted by hovering */
    readonly highlighted: boolean;
}

/** The formatted style of a treemap tile */
export interface AgTreemapSeriesStyle extends FillOptions, StrokeOptions {
    /** Whether the gradient is used for the treemap tile. */
    readonly gradient?: boolean;
}
