import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize, Ratio } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';
export interface AgChordSeriesOptions<TDatum = any> extends AgBaseSeriesOptions<TDatum>, AgChordSeriesOptionsKeys, AgChordSeriesOptionsNames, AgChordSeriesThemeableOptions<TDatum> {
    /** Configuration for the Chord Series. */
    type: 'chord';
}
export interface AgChordSeriesLinkItemStylerParams<TDatum> extends DatumCallbackParams<TDatum>, AgChordSeriesOptionsKeys, Required<AgChordSeriesLinkStyle> {
}
export interface AgChordSeriesNodeItemStylerParams<TDatum> extends DatumCallbackParams<TDatum>, AgChordSeriesOptionsKeys, Required<AgChordSeriesNodeStyle> {
    /** Label of the node */
    label: string | undefined;
    /** Size of the node */
    size: number;
}
export interface AgChordSeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions<TDatum> {
    /** Options for the label for each node. */
    label?: AgChordSeriesLabelOptions<TDatum>;
    /** The colours to cycle through for the fills of the nodes and links. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the nodes and links. */
    strokes?: CssColor[];
    /** Options for the links. */
    link?: AgChordSeriesLinkOptions<TDatum>;
    /** Options for the nodes. */
    node?: AgChordSeriesNodeOptions<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgChordSeriesTooltipRendererParams<TDatum>>;
}
export interface AgChordSeriesLabelOptions<TDatum> extends AgChartLabelOptions<TDatum, AgChordSeriesLabelFormatterParams<TDatum>> {
    /** Spacing between a node and its label. */
    spacing?: PixelSize;
    /** If the label text exceeds the maximum length, it will be truncated and an ellipsis will be appended to indicate this. */
    maxWidth?: PixelSize;
}
export interface AgChordSeriesLinkStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Tension of the links. 0 gives a maximally curved link, and 1 gives a straight line. */
    tension?: Ratio;
}
export interface AgChordSeriesLinkOptions<TDatum> extends AgChordSeriesLinkStyle {
    /** Function used to return formatting for individual links, based on the given parameters. If the current link is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgChordSeriesLinkItemStylerParams<TDatum>, AgChordSeriesLinkStyle>;
}
export interface AgChordSeriesNodeStyle extends FillOptions, StrokeOptions, LineDashOptions {
}
export interface AgChordSeriesNodeOptions<TDatum> extends AgChordSeriesNodeStyle {
    /** Minimum spacing between the nodes. */
    spacing?: PixelSize;
    /** Width of the nodes. */
    width?: PixelSize;
    /** Function used to return formatting for individual nodes, based on the given parameters. If the current node is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgChordSeriesNodeItemStylerParams<TDatum>, AgChordSeriesNodeStyle>;
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
export interface AgChordSeriesTooltipRendererParams<TDatum> extends AgSeriesTooltipRendererParams<TDatum>, AgChordSeriesOptionsKeys, AgChordSeriesOptionsNames {
}
export interface AgChordSeriesLabelFormatterParams<_TDatum = any> extends AgChordSeriesOptionsKeys {
}
