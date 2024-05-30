import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgChordSeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgChordSeriesOptionsKeys,
        AgChordSeriesOptionsNames,
        AgChordSeriesThemeableOptions<TDatum> {
    /** Configuration for the Chord Series. */
    type: 'chord';
}

export interface AgChordSeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions<TDatum> {
    /** Options for the label for each node. */
    label?: AgChordSeriesLabelOptions<TDatum>;
    /** The colours to cycle through for the fills of the nodes and links. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the nodes and links. */
    strokes?: CssColor[];
    /** Options for the links. */
    link?: AgChordSeriesLinkOptions;
    /** Options for the nodes. */
    node?: AgChordSeriesNodeOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgChordSeriesTooltipRendererParams>;
}

export interface AgChordSeriesLabelOptions<TDatum>
    extends AgChartLabelOptions<TDatum, AgChordSeriesLabelFormatterParams<TDatum>> {
    /** Spacing between a node and its label. */
    spacing?: PixelSize;
    /** If the label text exceeds the maximum length, it will be truncated and an ellipsis will be appended to indicate this. */
    maxWidth?: PixelSize;
}

export interface AgChordSeriesLinkStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgChordSeriesLinkOptions extends AgChordSeriesLinkStyle {}
export interface AgChordSeriesNodeOptions extends FillOptions, StrokeOptions, LineDashOptions {
    /** Minimum spacing between the nodes. */
    spacing?: PixelSize;
    /** Width of the nodes. */
    width?: PixelSize;
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

export interface AgChordSeriesTooltipRendererParams
    extends AgSeriesTooltipRendererParams,
        AgChordSeriesOptionsKeys,
        AgChordSeriesOptionsNames {}

export interface AgChordSeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgChordSeriesOptionsKeys,
        AgChordSeriesLinkStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}

export interface AgChordSeriesLabelFormatterParams<_TDatum = any> extends AgChordSeriesOptionsKeys {}
