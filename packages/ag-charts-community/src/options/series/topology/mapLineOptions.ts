import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, GeoJSON, LabelPlacement } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgMapLineSeriesTooltipRendererParams<TDatum>
    extends AgChartCallbackParams<TDatum>,
        AgMapLineSeriesOptionsKeys,
        AgMapLineSeriesOptionsNames {
    /** The title of the Feature. */
    title: string;
    /** The computed fill colour of the Feature. */
    color: CssColor | undefined;
}

export interface AgMapLineSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle, StrokeOptions {}

export interface AgMapLineSeriesStyle extends StrokeOptions, LineDashOptions {}

export interface AgMapLineSeriesLabel<TDatum> extends AgChartLabelOptions<TDatum, AgMapLineSeriesLabelFormatterParams> {
    /** Placement of label in relation to the marker (if visible). Defaults to `bottom`. */
    placement?: LabelPlacement;
}

export interface AgMapLineSeriesBackground extends FillOptions, StrokeOptions {
    /** Topology to use for the background. */
    topology?: GeoJSON;
    /** ID of the feature to use from the topology. */
    id?: string;
    /** The property to reference in the topology to match up with data. Defaults to `name`. */
    topologyIdKey?: string;
}

export interface AgMapLineSeriesThemeableOptions<TDatum = any>
    extends AgMapLineSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** Configuration for an optional background */
    background?: AgMapLineSeriesBackground;
    /** Configuration for the labels shown on top of data points. */
    label?: AgMapLineSeriesLabel<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapLineSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Map sector based on the input parameters. */
    formatter?: (params: AgMapLineSeriesFormatterParams) => AgMapLineSeriesStyle;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgMapLineSeriesHighlightStyle<TDatum>;
}

export interface AgMapLineSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgMapLineSeriesOptionsKeys,
        AgMapLineSeriesOptionsNames,
        AgMapLineSeriesThemeableOptions<TDatum> {
    /** Configuration for the Map Series. */
    type: 'map-line';
    /** GeoJSON data. */
    topology?: GeoJSON;
    /** The property to reference in the topology to match up with data. Defaults to `name`. */
    topologyIdKey?: string;
    /** Human-readable description of the series. */
    legendItemName?: string;
}

export interface AgMapLineSeriesOptionsKeys {
    /** The name of the node key containing the id value. */
    idKey?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the line stroke. */
    colorKey?: string;
    /** The key to use to retrieve values from the data to use as labels for the markers. */
    labelKey?: string;
}

export interface AgMapLineSeriesOptionsNames {
    /** A human-readable description of the id-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    idName?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    labelName?: string;
}

export type AgMapLineSeriesLabelFormatterParams = AgMapLineSeriesOptionsKeys & AgMapLineSeriesOptionsNames;

/** The parameters of the Map series formatter function */
export interface AgMapLineSeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgMapLineSeriesOptionsKeys,
        AgMapLineSeriesStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}

/** The formatted style of a Map sector. */
export interface AgMapLineSeriesStyle extends StrokeOptions {}
