import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgSankeySeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgSankeySeriesOptionsKeys,
        AgSankeySeriesOptionsNames,
        AgSankeySeriesThemeableOptions<TDatum> {
    /** Configuration for the Sankey Series. */
    type: 'sankey';
}

export interface AgSankeySeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions<TDatum> {
    /** Options for the label for each node. */
    label?: AgSankeySeriesLabelOptions<TDatum>;
    /** The colours to cycle through for the fills of the nodes and links. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the nodes and links. */
    strokes?: CssColor[];
    /** Options for the links. */
    link?: AgSankeySeriesLinkOptions;
    /** Options for the nodes. */
    node?: AgSankeySeriesNodeOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgSankeySeriesTooltipRendererParams>;
}

export interface AgSankeySeriesLabelOptions<TDatum>
    extends AgChartLabelOptions<TDatum, AgSankeySeriesLabelFormatterParams<TDatum>> {
    /** Spacing between a node and its label. */
    spacing?: PixelSize;
}

export interface AgSankeySeriesLinkStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgSankeySeriesLinkOptions extends AgSankeySeriesLinkStyle {}
export interface AgSankeySeriesNodeOptions extends FillOptions, StrokeOptions, LineDashOptions {
    /** Minimum spacing between the nodes. */
    spacing?: PixelSize;
    /** Width of the nodes. */
    width?: PixelSize;
    /** Alignment of the nodes. */
    alignment?: 'left' | 'right' | 'center' | 'justify';
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

export interface AgSankeySeriesTooltipRendererParams
    extends AgSeriesTooltipRendererParams,
        AgSankeySeriesOptionsKeys,
        AgSankeySeriesOptionsNames {}

export interface AgSankeySeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgSankeySeriesOptionsKeys,
        AgSankeySeriesLinkStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}

export interface AgSankeySeriesLabelFormatterParams<_TDatum = any> extends AgSankeySeriesOptionsKeys {}
