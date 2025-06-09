import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { GeoJSON, PixelSize, TContextDefault, TDatumDefault } from '../../chart/types';
import type { LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export type AgMapLineSeriesTooltipRendererParams<TDatum = TDatumDefault> = AgSeriesTooltipRendererParams<TDatum> &
    AgMapLineSeriesOptionsKeys<TDatum> &
    AgMapLineSeriesOptionsNames &
    AgMapLineSeriesStyle;

export type AgMapLineSeriesHighlightStyle<_TDatum> = AgSeriesHighlightStyle & StrokeOptions;

export type AgMapLineSeriesStyle = StrokeOptions & LineDashOptions;

export type AgMapLineSeriesLabel<TDatum> = AgChartLabelOptions<TDatum, AgMapLineSeriesLabelFormatterParams<TDatum>>;

export type AgMapLineSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgMapLineSeriesOptionsKeys<TDatum> &
    AgMapLineSeriesOptionsNames;

export type AgMapLineSeriesItemStylerParams<TDatum = TDatumDefault> = DatumCallbackParams<TDatum> &
    AgMapLineSeriesOptionsKeys<TDatum> &
    Required<AgMapLineSeriesStyle>;

export interface AgMapLineSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The name of the node key containing the id value. */
    idKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve size values from the data, used to control the width of the stroke. */
    sizeKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the colour of the stroke. */
    colorKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve values from the data to use as labels on top of lines. */
    labelKey?: TDatum extends object ? keyof TDatum & string : string;
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

export interface AgMapLineSeriesThemeableOptions<TDatum = TDatumDefault>
    extends AgMapLineSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** Determines the largest width a stroke can be in pixels. */
    maxStrokeWidth?: PixelSize;
    /** Explicitly specifies the extent of the domain for series `sizeKey`. */
    sizeDomain?: number[];
    /** Configuration for the labels shown on top of the line. */
    label?: AgMapLineSeriesLabel<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapLineSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Map line based on the input parameters. */
    itemStyler?: Styler<AgMapLineSeriesItemStylerParams<TDatum>, AgMapLineSeriesStyle>;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgMapLineSeriesHighlightStyle<TDatum>;
}

export interface AgMapLineSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlightStyle'>,
        AgMapLineSeriesOptionsKeys<TDatum>,
        AgMapLineSeriesOptionsNames,
        AgMapLineSeriesThemeableOptions<TDatum> {
    /** Configuration for the Map Line Series. */
    type: 'map-line';
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
