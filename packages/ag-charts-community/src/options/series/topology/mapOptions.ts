import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgSeriesMarkerOptions } from '../markerOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgMapSeriesTooltipRendererParams<TDatum>
    extends AgChartCallbackParams<TDatum>,
        AgMapSeriesOptionsKeys,
        AgMapSeriesOptionsNames {
    /** The title of the Feature. */
    title: string;
    /** The computed fill colour of the Feature. */
    color: CssColor | undefined;
}

export interface AgMapSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle, FillOptions, StrokeOptions {}

export interface AgMapSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgMapSeriesMarker<TDatum> extends AgSeriesMarkerOptions<AgMapSeriesOptionsKeys, TDatum> {
    /** Determines the largest size a marker can be in pixels. */
    maxSize?: PixelSize;
    /** Explicitly specifies the extent of the domain for series `sizeKey`. */
    domain?: [number, number];
}

export interface AgMapSeriesBackground extends FillOptions, StrokeOptions {
    /** Topology to use for the background. */
    topology?: any;
    /** ID of the feature to use from the topology. */
    id?: string;
}

export interface AgMapSeriesThemeableOptions<TDatum = any>
    extends AgMapSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** The colour range to interpolate the numeric colour domain (min and max `colorKey` values) into. */
    colorRange?: CssColor[];
    /** Configuration for an optional background */
    background?: AgMapSeriesBackground;
    /** Configuration for the markers used in the series. */
    marker?: AgMapSeriesMarker<TDatum>;
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgMapSeriesLabelFormatterParams>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Map sector based on the input parameters. */
    formatter?: (params: AgMapSeriesFormatterParams) => AgMapSeriesStyle;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgMapSeriesHighlightStyle<TDatum>;
}

export interface AgMapSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgMapSeriesOptionsKeys,
        AgMapSeriesOptionsNames,
        AgMapSeriesThemeableOptions<TDatum> {
    /** Configuration for the Map Series. */
    type: 'map';
    /** GeoJSON data. */
    topology: any;
}

export interface AgMapSeriesOptionsKeys {
    /** The name of the node key containing the id value. */
    idKey?: string;
    /** The key to use to retrieve size values from the data, used to control the size of the markers. */
    sizeKey?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the segment colour. */
    colorKey?: string;
}

export interface AgMapSeriesOptionsNames {
    /** The key to use to retrieve size values from the data, used to control the size of the markers.  */
    sizeName?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
}

export type AgMapSeriesLabelFormatterParams = AgMapSeriesOptionsKeys & AgMapSeriesOptionsNames;

/** The parameters of the Map series formatter function */
export interface AgMapSeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgMapSeriesOptionsKeys,
        AgMapSeriesOptionsNames,
        AgMapSeriesStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}

/** The formatted style of a Map sector. */
export interface AgMapSeriesStyle extends FillOptions, StrokeOptions {}
