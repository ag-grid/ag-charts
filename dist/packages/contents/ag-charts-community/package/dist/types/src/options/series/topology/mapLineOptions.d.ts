import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, GeoJSON, Opacity, PixelSize } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';
export interface AgMapLineSeriesTooltipRendererParams<TDatum> extends AgChartCallbackParams<TDatum>, AgMapLineSeriesOptionsKeys, AgMapLineSeriesOptionsNames {
    /** The title of the Feature. */
    title: string;
    /** The computed fill colour of the Feature. */
    color: CssColor | undefined;
}
export interface AgMapLineSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle, StrokeOptions {
}
export interface AgMapLineSeriesStyle extends LineDashOptions {
    /** The colour for the stroke of the line. */
    stroke?: CssColor;
    /** The width of the stroke in pixels. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke colour. */
    strokeOpacity?: Opacity;
}
export interface AgMapLineSeriesLabel<TDatum> extends AgChartLabelOptions<TDatum, AgMapLineSeriesLabelFormatterParams> {
}
export interface AgMapLineSeriesThemeableOptions<TDatum = any> extends AgMapLineSeriesStyle, Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** Determines the largest width a stroke can be in pixels. */
    maxStrokeWidth?: PixelSize;
    /** Explicitly specifies the extent of the domain for series `sizeKey`. */
    sizeDomain?: number[];
    /** Configuration for the labels shown on top of the line. */
    label?: AgMapLineSeriesLabel<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapLineSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Map line based on the input parameters. */
    formatter?: (params: AgMapLineSeriesFormatterParams) => AgMapLineSeriesStyle;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgMapLineSeriesHighlightStyle<TDatum>;
}
export interface AgMapLineSeriesOptions<TDatum = any> extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>, AgMapLineSeriesOptionsKeys, AgMapLineSeriesOptionsNames, AgMapLineSeriesThemeableOptions<TDatum> {
    /** Configuration for the Map Line Series. */
    type: 'map-line';
    /** GeoJSON data. */
    topology?: GeoJSON;
    /**
     * The property to reference in the topology to match up with data.
     * Default: `name`
     */
    topologyIdKey?: string;
    /** The title to use for the series. */
    title?: string;
    /**
     * The text to display in the legend for this series.
     * If multiple series share this value, they will be merged for the legend toggle behaviour.
     */
    legendItemName?: string;
}
export interface AgMapLineSeriesOptionsKeys {
    /** The name of the node key containing the id value. */
    idKey?: string;
    /** The key to use to retrieve size values from the data, used to control the width of the stroke. */
    sizeKey?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the colour of the stroke. */
    colorKey?: string;
    /** The key to use to retrieve values from the data to use as labels on top of lines. */
    labelKey?: string;
}
export interface AgMapLineSeriesOptionsNames {
    /** A human-readable description of the id-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    idName?: string;
    /** A human-readable description of the size values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    sizeName?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    labelName?: string;
}
export type AgMapLineSeriesLabelFormatterParams = AgMapLineSeriesOptionsKeys & AgMapLineSeriesOptionsNames;
/** The parameters of the Map series formatter function */
export interface AgMapLineSeriesFormatterParams<TDatum = any> extends AgChartCallbackParams<TDatum>, AgMapLineSeriesOptionsKeys, AgMapLineSeriesStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}
