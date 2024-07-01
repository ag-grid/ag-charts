import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
export interface AgSankeySeriesOptions<TDatum = any> extends AgBaseSeriesOptions<TDatum>, AgSankeySeriesOptionsKeys, AgSankeySeriesOptionsNames, AgSankeySeriesThemeableOptions<TDatum> {
    /** Configuration for the Sankey Series. */
    type: 'sankey';
}
export interface AgSankeySeriesLinkItemStylerParams<TDatum> extends DatumCallbackParams<TDatum>, AgSankeySeriesOptionsKeys, Required<AgSankeySeriesLinkStyle> {
}
export interface AgSankeySeriesNodeItemStylerParams<TDatum> extends DatumCallbackParams<TDatum>, AgSankeySeriesOptionsKeys, Required<AgSankeySeriesNodeStyle> {
    /** Label of the node */
    label: string | undefined;
    /** Size of the node */
    size: number;
}
export interface AgSankeySeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions<TDatum> {
    /** Options for the label for each node. */
    label?: AgSankeySeriesLabelOptions<TDatum>;
    /** The colours to cycle through for the fills of the nodes and links. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the nodes and links. */
    strokes?: CssColor[];
    /** Options for the links. */
    link?: AgSankeySeriesLinkOptions<TDatum>;
    /** Options for the nodes. */
    node?: AgSankeySeriesNodeOptions<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgSankeySeriesTooltipRendererParams<TDatum>>;
}
export interface AgSankeySeriesLabelOptions<TDatum> extends AgChartLabelOptions<TDatum, AgSankeySeriesLabelFormatterParams<TDatum>> {
    /** Spacing between a node and its label. */
    spacing?: PixelSize;
}
export interface AgSankeySeriesLinkStyle extends FillOptions, StrokeOptions, LineDashOptions {
}
export interface AgSankeySeriesLinkOptions<TDatum> extends AgSankeySeriesLinkStyle {
    /** Function used to return formatting for individual links, based on the given parameters. If the current link is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgSankeySeriesLinkItemStylerParams<TDatum>, AgSankeySeriesLinkStyle>;
}
export interface AgSankeySeriesNodeStyle extends FillOptions, StrokeOptions, LineDashOptions {
}
export interface AgSankeySeriesNodeOptions<TDatum> extends AgSankeySeriesNodeStyle {
    /** Minimum spacing between the nodes. */
    spacing?: PixelSize;
    /** Width of the nodes. */
    width?: PixelSize;
    /** Alignment of the nodes. */
    alignment?: 'left' | 'right' | 'center' | 'justify';
    /** Function used to return formatting for individual nodes, based on the given parameters. If the current node is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgSankeySeriesNodeItemStylerParams<TDatum>, AgSankeySeriesNodeStyle>;
}
export interface AgSankeySeriesOptionsKeys {
    /** The key containing the start node of each link. */
    fromKey?: string;
    /** The key containing the end node of each link. */
    toKey?: string;
    /** The key containing the size of each link. */
    sizeKey?: string;
}
export interface AgSankeySeriesOptionsNames {
    /** A human-readable description of the size values.
     * If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    sizeName?: string;
}
export interface AgSankeySeriesTooltipRendererParams<TDatum> extends AgSeriesTooltipRendererParams<TDatum>, AgSankeySeriesOptionsKeys, AgSankeySeriesOptionsNames {
}
export interface AgSankeySeriesLabelFormatterParams<_TDatum = any> extends AgSankeySeriesOptionsKeys {
}
