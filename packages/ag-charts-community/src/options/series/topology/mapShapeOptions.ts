import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor, LabelPlacement } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgMapShapeSeriesTooltipRendererParams<TDatum>
    extends AgChartCallbackParams<TDatum>,
        AgMapShapeSeriesOptionsKeys,
        AgMapShapeSeriesOptionsNames {
    /** The title of the Feature. */
    title: string;
    /** The computed fill colour of the Feature. */
    color: CssColor | undefined;
}

export interface AgMapShapeSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle, FillOptions, StrokeOptions {}

export interface AgMapShapeSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgMapShapeSeriesLabel<TDatum>
    extends AgChartLabelOptions<TDatum, AgMapShapeSeriesLabelFormatterParams> {
    /** Placement of label in relation to the marker (if visible). Defaults to `bottom`. */
    placement?: LabelPlacement;
}

export interface AgMapShapeSeriesBackground extends FillOptions, StrokeOptions {
    /** Topology to use for the background. */
    topology?: any;
    /** ID of the feature to use from the topology. */
    id?: string;
    /** The property to reference in the topology to match up with data. Defaults to `name`. */
    topologyIdKey?: string;
}

export interface AgMapShapeSeriesThemeableOptions<TDatum = any>
    extends AgMapShapeSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** The colour range to interpolate the numeric colour domain (min and max `colorKey` values) into. */
    colorRange?: CssColor[];
    /** Configuration for the labels shown on top of data points. */
    label?: AgMapShapeSeriesLabel<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapShapeSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Map sector based on the input parameters. */
    formatter?: (params: AgMapShapeSeriesFormatterParams) => AgMapShapeSeriesStyle;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgMapShapeSeriesHighlightStyle<TDatum>;
}

export interface AgMapShapeSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgMapShapeSeriesOptionsKeys,
        AgMapShapeSeriesOptionsNames,
        AgMapShapeSeriesThemeableOptions<TDatum> {
    /** Configuration for the Map Series. */
    type: 'map-shape';
    /** GeoJSON data. */
    topology?: any;
    /** The property to reference in the topology to match up with data. Defaults to `name`. */
    topologyIdKey?: string;
    /** Human-readable description of the series. */
    legendItemName?: string;
}

export interface AgMapShapeSeriesOptionsKeys {
    /** The name of the node key containing the id value. */
    idKey?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the segment colour. */
    colorKey?: string;
    /** The key to use to retrieve values from the data to use as labels for the markers. */
    labelKey?: string;
}

export interface AgMapShapeSeriesOptionsNames {
    /** A human-readable description of the id-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    idName?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    labelName?: string;
}

export type AgMapShapeSeriesLabelFormatterParams = AgMapShapeSeriesOptionsKeys & AgMapShapeSeriesOptionsNames;

/** The parameters of the Map series formatter function */
export interface AgMapShapeSeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgMapShapeSeriesOptionsKeys,
        AgMapShapeSeriesStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}

/** The formatted style of a Map sector. */
export interface AgMapShapeSeriesStyle extends FillOptions, StrokeOptions {}
