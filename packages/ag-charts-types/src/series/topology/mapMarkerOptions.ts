import type { ContextCallbackParams, DatumCallbackParams, HighlightState, Styler } from '../../chart/callbackOptions';
import type { AgChartLabelCollisionPlacement } from '../../chart/collisionAvoidanceOptions';
import type { AgNumericValue } from '../../chart/dataValues';
import type { AgChartLabelCollisionFitOptions, AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { AgMarkerShape, ContextDefault, DatumDefault, DatumKey, GeoJSON, PixelSize } from '../../chart/types';
import type { AgColorScale, FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type {
    AgBaseSeriesOptions,
    AgBaseSeriesThemeableOptions,
    AgHighlightStyleOptions,
    AgMultiSeriesHighlightOptions,
} from '../seriesOptions';

export interface AgMapMarkerSeriesTooltipRendererParams<TDatum, TContext = ContextDefault>
    extends
        AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgMapMarkerSeriesOptionsKeys<TDatum>,
        AgMapMarkerSeriesOptionsNames,
        AgMapMarkerSeriesStyle {}

export type AgMapMarkerSeriesLabelFormatterParams<TDatum = DatumDefault> = AgMapMarkerSeriesOptionsKeys<TDatum> &
    AgMapMarkerSeriesOptionsNames;

export type AgMapMarkerSeriesItemStylerParams<TDatum = DatumDefault, TContext = ContextDefault> = DatumCallbackParams<
    TDatum,
    HighlightState
> &
    ContextCallbackParams<TContext> &
    AgMapMarkerSeriesOptionsKeys<TDatum> &
    Required<AgMapMarkerSeriesStyle>;

export interface AgMapMarkerSeriesOptionsKeys<TDatum = DatumDefault> {
    /** The name of the node key containing the id value. */
    idKey?: DatumKey<TDatum>;
    /** The key to use to retrieve latitude values from the data, used to control the position of the markers. */
    latitudeKey?: DatumKey<TDatum>;
    /** The key to use to retrieve longitude values from the data, used to control the position of the markers. */
    longitudeKey?: DatumKey<TDatum>;
    /** The key to use to retrieve size values from the data, used to control the size of the markers. */
    sizeKey?: DatumKey<TDatum>;
    /** The name of the node key containing the colour value. This value (along with `colorScale` config) will be used to determine the colour of the markers. */
    colorKey?: DatumKey<TDatum>;
    /** The key to use to retrieve values from the data to use as labels for the markers. */
    labelKey?: DatumKey<TDatum>;
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

export interface AgMapMarkerSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** The shape to use for the markers. You can also supply a custom marker by providing a `AgMarkerShapeFn` function. */
    shape?: AgMarkerShape;
    /**
     * The size in pixels of the markers. Used as the fixed marker size only when `sizeKey` is absent; when
     * `sizeKey` is present the scale lower bound is controlled by `minSize` instead.
     */
    size?: PixelSize;
}

export interface AgMapMarkerSeriesLabel<TDatum, TContext = ContextDefault>
    extends
        AgChartLabelOptions<TDatum, AgMapMarkerSeriesLabelFormatterParams<TDatum>, TContext>,
        AgChartLabelCollisionFitOptions {
    /**
     * Placement of the label in relation to the marker. Either a single placement or an ordered
     * fallback list tried in turn until one fits.
     *
     * Default: `bottom`
     */
    placement?: AgChartLabelCollisionPlacement | AgChartLabelCollisionPlacement[];
}

export interface AgMapMarkerSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        AgMapMarkerSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum, TContext>, 'highlightStyle' | 'highlight'> {
    /**
     * Determines the smallest size a marker can be in pixels when `sizeKey` is present. Defaults to `size` when not set.
     */
    minSize?: PixelSize;
    /** Determines the largest size a marker can be in pixels when `sizeKey` is present. */
    maxSize?: PixelSize;
    /**
     * Explicitly specifies the extent of the domain of `sizeKey` values to map onto the `[minSize, maxSize]` range.
     *
     * Reverse the bounds (e.g. `[100, 0]`) to invert the mapping so that larger values produce smaller markers.
     */
    sizeDomain?: [AgNumericValue, AgNumericValue];
    /** Configuration for colour scale with fills, domain, and mode. */
    colorScale?: AgColorScale;
    /** Configuration for the labels shown on top of data points. */
    label?: AgMapMarkerSeriesLabel<TDatum, TContext>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapMarkerSeriesTooltipRendererParams<TDatum, TContext>>;
    /** A callback function for adjusting the styles of a particular Map marker based on the input parameters. */
    itemStyler?: Styler<AgMapMarkerSeriesItemStylerParams<TDatum, TContext>, AgMapMarkerSeriesStyle>;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesHighlightOptions<AgHighlightStyleOptions, AgHighlightStyleOptions>;
}

export interface AgMapMarkerSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlightStyle' | 'highlight'>,
        AgMapMarkerSeriesOptionsKeys<TDatum>,
        AgMapMarkerSeriesOptionsNames,
        AgMapMarkerSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Map Marker Series. */
    type: 'map-marker';
    /** GeoJSON data. */
    topology?: GeoJSON;
    /**
     * The property to reference in the topology to match up with data.
     *
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
