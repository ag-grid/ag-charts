import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { FillOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgSeriesMarkerOptions } from '../markerOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgMapMarkerSeriesTooltipRendererParams<TDatum>
    extends AgChartCallbackParams<TDatum>,
        AgMapMarkerSeriesOptionsKeys,
        AgMapMarkerSeriesOptionsNames {
    /** The title of the Feature. */
    title: string;
    /** The computed fill colour of the Feature. */
    color: CssColor | undefined;
}

export interface AgMapMarkerSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle, FillOptions, StrokeOptions {}

export interface AgMapMarkerSeriesStyle {}

export interface AgMapMarkerSeriesMarker<TDatum> extends AgSeriesMarkerOptions<AgMapMarkerSeriesOptionsKeys, TDatum> {
    /** Determines the largest size a marker can be in pixels. */
    maxSize?: PixelSize;
    /** Explicitly specifies the extent of the domain for series `sizeKey`. */
    domain?: [number, number];
}

export interface AgMapMarkerSeriesBackground extends FillOptions, StrokeOptions {
    /** Topology to use for the background. */
    topology?: any;
    /** ID of the feature to use from the topology. */
    id?: string;
}

export interface AgMapMarkerSeriesThemeableOptions<TDatum = any>
    extends AgMapMarkerSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** The colour range to interpolate the numeric colour domain (min and max `colorKey` values) into. */
    colorRange?: CssColor[];
    /** Configuration for an optional background */
    background?: AgMapMarkerSeriesBackground;
    /** Configuration for the markers used in the series. */
    marker?: AgMapMarkerSeriesMarker<TDatum>;
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgMapMarkerSeriesLabelFormatterParams>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Map sector based on the input parameters. */
    formatter?: (params: AgMapMarkerSeriesFormatterParams) => AgMapMarkerSeriesStyle;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgMapMarkerSeriesHighlightStyle<TDatum>;
}

export interface AgMapMarkerSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgMapMarkerSeriesOptionsKeys,
        AgMapMarkerSeriesOptionsNames,
        AgMapMarkerSeriesThemeableOptions<TDatum> {
    /** Configuration for the Map Series. */
    type: 'map-marker';
    /** GeoJSON data. */
    topology: any;
}

export interface AgMapMarkerSeriesOptionsKeys {
    /** The latitude of a marker. */
    latKey?: string;
    /** The longitude of a marker. */
    lonKey?: string;
    /** The key to use to retrieve size values from the data, used to control the size of the markers. */
    sizeKey?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the segment colour. */
    colorKey?: string;
}

export interface AgMapMarkerSeriesOptionsNames {
    /** The key to use to retrieve size values from the data, used to control the size of the markers.  */
    sizeName?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
}

export type AgMapMarkerSeriesLabelFormatterParams = AgMapMarkerSeriesOptionsKeys & AgMapMarkerSeriesOptionsNames;

/** The parameters of the Map series formatter function */
export interface AgMapMarkerSeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgMapMarkerSeriesOptionsKeys,
        AgMapMarkerSeriesOptionsNames,
        AgMapMarkerSeriesStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}

/** The formatted style of a Map sector. */
export interface AgMapMarkerSeriesStyle extends FillOptions, StrokeOptions {}
