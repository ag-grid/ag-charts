import type { AgChartCallbackParams } from '../../chart/callbackOptions';
import type { AgSeriesTooltip } from '../../chart/tooltipOptions';
import type { CssColor } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgMapSeriesTooltipRendererParams<TDatum>
    extends AgChartCallbackParams<TDatum>,
        AgMapSeriesOptionsKeys {
    /** The title of the Feature. */
    title?: string;
    /** The computed fill colour of the Feature. */
    color?: CssColor;
}

export interface AgMapSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle, FillOptions, StrokeOptions {}

export interface AgMapSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgMapSeriesThemeableOptions<TDatum = any>
    extends AgMapSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** The colour range to interpolate the numeric colour domain (min and max `colorKey` values) into. */
    colorRange?: CssColor[];
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgMapSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Map sector based on the input parameters. */
    formatter?: (params: AgMapSeriesFormatterParams<TDatum>) => AgMapSeriesStyle;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgMapSeriesHighlightStyle<TDatum>;
}

export interface AgMapSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgMapSeriesOptionsKeys,
        AgMapSeriesThemeableOptions<TDatum> {
    /** Configuration for the Map Series. */
    type: 'map';
    /** GeoJSON data. */
    topology: any;
}

export interface AgMapSeriesOptionsKeys {
    /** The name of the node key containing the id value. */
    idKey?: string;
    /** The name of the node key containing the colour value. This value (along with `colorRange` config) will be used to determine the segment colour. */
    colorKey?: string;
    /** A human-readable description of the colour values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    colorName?: string;
}

/** The parameters of the Map series formatter function */
export interface AgMapSeriesFormatterParams<TDatum = any>
    extends AgChartCallbackParams<TDatum>,
        AgMapSeriesOptionsKeys,
        AgMapSeriesStyle {
    /** `true` if the sector is highlighted by hovering. */
    readonly highlighted: boolean;
}

/** The formatted style of a Map sector. */
export interface AgMapSeriesStyle extends FillOptions, StrokeOptions {}
