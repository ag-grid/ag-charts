import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, GeoJSON, LabelPlacement, MarkerShape, PixelSize } from '../../chart/types';
import type { FillOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';
export interface AgMapMarkerSeriesTooltipRendererParams<TDatum> extends AgChartCallbackParams<TDatum>, AgMapMarkerSeriesOptionsKeys, AgMapMarkerSeriesOptionsNames {
    /** The title of the Feature. */
    title: string;
    /** The computed fill colour of the Feature. */
    color: CssColor | undefined;
}
export interface AgMapMarkerSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle, FillOptions, StrokeOptions {
}
export interface AgMapMarkerSeriesStyle extends FillOptions, StrokeOptions {
    /** The shape to use for the markers. You can also supply a custom marker by providing a `Marker` subclass. */
    shape?: MarkerShape;
    /** The size in pixels of the markers. */
    size?: PixelSize;
    /** Determines the largest size a marker can be in pixels. */
    maxSize?: PixelSize;
    /** Explicitly specifies the extent of the domain for series `sizeKey`. */
    sizeDomain?: [number, number];
}
export interface AgMapMarkerSeriesLabel<TDatum> extends AgChartLabelOptions<TDatum, AgMapMarkerSeriesLabelFormatterParams> {
    /**
     * Placement of label in relation to the marker.
     * Default: `bottom`
     */
    placement?: LabelPlacement;
}
export interface AgMapMarkerSeriesThemeableOptions<TDatum = any> extends AgMapMarkerSeriesStyle, Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** The colour range to interpolate the numeric colour domain (min and max `colorKey` values) into. */
    colorRange?: CssColor[];
    /** Configuration for the labels shown on top of data points. */
    label?: AgMapMarkerSeriesLabel<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Map marker based on the input parameters. */
    formatter?: (params: AgMapMarkerSeriesFormatterParams) => AgMapMarkerSeriesStyle;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgMapMarkerSeriesHighlightStyle<TDatum>;
}
export interface AgMapMarkerSeriesOptions<TDatum = any> extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>, AgMapMarkerSeriesOptionsKeys, AgMapMarkerSeriesOptionsNames, AgMapMarkerSeriesThemeableOptions<TDatum> {
    /** Configuration for the Map Marker Series. */
    type: 'map-marker';
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
export interface AgMapMarkerSeriesOptionsKeys {
    /** The name of the node key containing the id value. */
    idKey?: string;
    /** The key to use to retrieve latitude values from the data, used to control the position of the markers. */
    latitudeKey?: string;
    /** The key to use to retrieve longitude values from the data, used to control the position of the markers. */
    longitudeKey?: string;
    /** The key to use to retrieve size values from the data, used to control the size of the markers. */
    sizeKey?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the colour of the markers. */
    colorKey?: string;
    /** The key to use to retrieve values from the data to use as labels for the markers. */
    labelKey?: string;
}
export interface AgMapMarkerSeriesOptionsNames {
    /** A human-readable description of the id-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    idName?: string;
    /** A human-readable description of the latitude values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    latitudeName?: string;
    /** A human-readable description of the longitude values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    longitudeName?: string;
    /** A human-readable description of the size values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    sizeName?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    labelName?: string;
}
export type AgMapMarkerSeriesLabelFormatterParams = AgMapMarkerSeriesOptionsKeys & AgMapMarkerSeriesOptionsNames;
/** The parameters of the Map series formatter function */
export interface AgMapMarkerSeriesFormatterParams<TDatum = any> extends AgChartCallbackParams<TDatum>, AgMapMarkerSeriesOptionsKeys, AgMapMarkerSeriesStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}
