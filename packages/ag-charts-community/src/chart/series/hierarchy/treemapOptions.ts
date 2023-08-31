import type { AgDropShadowOptions } from '../../options/dropShadowOptions';
import type { AgSeriesListeners } from '../../options/eventOptions';
import type { AgChartLabelOptions } from '../../options/labelOptions';
import type { AgSeriesTooltip, AgTooltipRendererResult } from '../../options/tooltipOptions';
import type { CssColor, DataValue, Opacity, PixelSize, TextWrap } from '../../options/types';
import type { AgBaseSeriesOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgTreemapSeriesLabelOptions extends AgChartLabelOptions {
    /** The amount of the tile's vertical space to reserve for the label. */
    padding?: number;
}

export interface AgTreemapSeriesTooltipRendererParams<DatumType> {
    /** Datum from the series data that the treemap tile is being rendered for. */
    datum: DatumType;
    /** The parent of the datum from the treemap data. */
    parent?: DataValue;
    /** The depth of the datum in the hierarchy. */
    depth: number;
    /** sizeKey as specified on series options. */
    sizeKey?: string;
    /** labelKey as specified on series options. */
    labelKey?: string;
    /** colorKey as specified on series options. */
    colorKey?: string;
    /** The computed fill colour of the treemap tile. */
    color?: string;
    /** The title of the treemap tile */
    title?: string;
    /** The ID of the series. */
    seriesId: string;
}

export interface AgTreemapSeriesTooltip<DatumType> extends AgSeriesTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgTreemapSeriesTooltipRendererParams<DatumType>) => string | AgTooltipRendererResult;
}

export interface AgTreemapSeriesLabelFormatterParams<DatumType> {
    datum: DatumType;
}

export interface AgTreemapSeriesTileLabelOptions extends AgChartLabelOptions {
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

export interface AgTreemapSeriesValueLabelOptions<DatumType> {
    /** A property to be used as a key to retrieve a value from datum. */
    key?: string;
    /** A name of a datum value. */
    name?: string;
    /** A function to generate a value label from datum. */
    formatter?: (params: AgTreemapSeriesLabelFormatterParams<DatumType>) => string;
    /** The label's font and color style. */
    style?: AgChartLabelOptions;
}

export interface AgTreemapSeriesLabelsOptions<DatumType> {
    /** The label configuration for the large leaf tiles. */
    large?: AgTreemapSeriesTileLabelOptions;
    /** The label configuration for the medium-sized leaf tiles. */
    medium?: AgTreemapSeriesTileLabelOptions;
    /** The label configuration for the small leaf tiles. */
    small?: AgTreemapSeriesTileLabelOptions;
    /** A function to generate a label/title for the cell. */
    formatter?: (params: AgTreemapSeriesLabelFormatterParams<DatumType>) => string;
    /** The configuration for the cell value label. */
    value?: AgTreemapSeriesValueLabelOptions<DatumType>;
}

export interface AgTreemapSeriesHighlightTextStyle {
    /** The colour of an item's text when tapped or hovered over. Use `undefined` for no highlight. */
    color?: CssColor;
}

export interface AgTreemapSeriesHighlightStyle extends AgSeriesHighlightStyle {
    /** Highlight style used for a text when item is tapped or hovered over. */
    text?: AgTreemapSeriesHighlightTextStyle;
}

/** Configuration for the treemap series. */
export interface AgTreemapSeriesOptions<DatumType = any> extends AgBaseSeriesOptions<DatumType> {
    type?: 'treemap';
    /** The label configuration for the top-level tiles. */
    title?: AgTreemapSeriesLabelOptions;
    /** The label configuration for the children of the top-level parent tiles. */
    subtitle?: AgTreemapSeriesLabelOptions;
    /** Configuration for the tile labels. */
    labels?: AgTreemapSeriesLabelsOptions<DatumType>;
    /** The name of the node key containing the label. */
    labelKey?: string;
    /** The name of the node key containing the size value. */
    sizeKey?: string;
    /** The name of the node key containing the color value. This value (along with `colorDomain` and `colorRange` configs) will be used to determine the tile color. */
    colorKey?: string;
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
    tooltip?: AgTreemapSeriesTooltip<DatumType>;
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
    /** Whether or not to use gradients for treemap tiles. */
    gradient?: boolean;
    /** Configuration for the shadow used behind the treemap tiles. */
    tileShadow?: AgDropShadowOptions;
    /** Configuration for the shadow used behind the treemap labels. */
    labelShadow?: AgDropShadowOptions;
    /** Determines whether the groups will be highlighted by cursor. */
    highlightGroups?: boolean;
    /** Configuration for treemap tiles when they are hovered over. */
    highlightStyle?: AgTreemapSeriesHighlightStyle;
    /** A callback function for adjusting the styles of a particular treemap tile based on the input parameters */
    formatter?: (params: AgTreemapSeriesFormatterParams<DataValue>) => AgTreemapSeriesFormat;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}

/** The parameters of the treemap series formatter function */
export interface AgTreemapSeriesFormatterParams<DataValue = any> {
    /** Datum from the series data that the treemap tile is being rendered for. */
    readonly datum: DataValue;
    /** The parent of the datum from the treemap data. */
    readonly parent?: DataValue;
    /** The depth of the datum in the hierarchy. */
    readonly depth: number;
    /** labelKey as specified on series options. */
    readonly labelKey: string;
    /** sizeKey as specified on series options. */
    readonly sizeKey?: string;
    /** colorKey as specified on series options. */
    readonly colorKey?: string;
    /** The colour of the fill for the treemap tile. */
    readonly fill?: CssColor;
    /** The opacity of the fill for the treemap tile. */
    readonly fillOpacity?: Opacity;
    /** The colour of the stroke for the treemap tile. */
    readonly stroke?: CssColor;
    /** The opacity of the stroke for the treemap tile. */
    readonly strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the treemap tile. */
    readonly strokeWidth?: PixelSize;
    /** Whether or not the gradients are used for treemap tiles. */
    readonly gradient?: boolean;
    /** `true` if the tile is highlighted by hovering */
    readonly highlighted: boolean;
    /** The ID of the series. */
    readonly seriesId: string;
}

/** The formatted style of a treemap tile */
export interface AgTreemapSeriesFormat {
    /** The colour of the fill for the treemap tile. */
    readonly fill?: CssColor;
    /** The opacity of the fill for the treemap tile. */
    readonly fillOpacity?: Opacity;
    /** The colour of the stroke for the treemap tile. */
    readonly stroke?: CssColor;
    /** The opacity of the stroke for the treemap tile. */
    readonly strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the treemap tile. */
    readonly strokeWidth?: PixelSize;
    /** Whether or not the gradient is used for the treemap tile. */
    readonly gradient?: boolean;
}
