import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions } from '../seriesOptions';

export interface AgChordSeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgChordSeriesOptionsKeys,
        AgChordSeriesThemeableOptions<TDatum> {
    /** Configuration for the Chord Series. */
    type: 'chord';
    /** Node options */
}

export interface AgChordSeriesThemeableOptions<TDatum = any> extends AgBaseSeriesThemeableOptions<TDatum> {
    nodes?: any[];
    /** The colours to cycle through for the fills of the nodes and links. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the nodes and links. */
    strokes?: CssColor[];
    /** Options for the links */
    link?: AgChordSeriesLinkOptions;
    /** Options for the nodes */
    node?: AgChordSeriesNodeOptions;
}

export interface AgChordSeriesLinkStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgChordSeriesLinkOptions extends AgChordSeriesLinkStyle {}
export interface AgChordSeriesNodeOptions extends FillOptions, StrokeOptions, LineDashOptions {
    /** Spacing of the nodes */
    spacing?: PixelSize;
    /** Height of the nodes */
    height?: PixelSize;
}

export interface AgChordSeriesOptionsKeys {
    /** The name of the node key containing the from id. */
    fromIdKey?: string;
    /** The name of the node key containing the to id. */
    toIdKey?: string;
    /** The name of the node key containing the size. */
    sizeKey?: string;
    /** The name of the node key containing the node id. */
    nodeIdKey?: string;
    /** The name of the node key containing the node size. */
    nodeSizeKey?: string;
    /** The name of the node key containing the node label. */
    labelKey?: string;
}

export interface AgChordSeriesOptionsNames {
    /** The name of the node key containing the from id. */
    fromIdName?: string;
    /** The name of the node key containing the to id. */
    toIdName?: string;
    /** The name of the node key containing the size. */
    sizeName?: string;
    /** The name of the node key containing the node id. */
    nodeIdName?: string;
    /** The name of the node key containing the node size. */
    nodeSizeName?: string;
    /** The name of the node key containing the label. */
    labelName?: string;
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
