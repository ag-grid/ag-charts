import type { ContextCallbackParams, DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { Opacity, PixelSize, TContextDefault, TDatumDefault } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesThemeableOptions, AgMultiSeriesHighlightOptions } from '../seriesOptions';

export interface AgBaseRadialSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesThemeableOptions<TDatum, TContext>,
        AgRadialSeriesStyle {
    /** Configuration for the labels shown on top of data points. */
    label?: AgChartLabelOptions<TDatum, AgRadialSeriesLabelFormatterParams<TDatum>, TContext>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadialSeriesTooltipRendererParams<TDatum, TContext>>;
    /** A styler function for adjusting the styling of the radial columns. */
    itemStyler?: Styler<AgRadialSeriesItemStylerParams<TDatum, TContext>, AgRadialSeriesStyle>;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesHighlightOptions<AgRadialHighlightStyleOptions>;
}

export interface AgRadialHighlightStyleOptions extends AgRadialSeriesStyle {
    /** The opacity of the whole series (area line, area fill, labels and markers, if any) */
    opacity?: Opacity;
}

export interface AgRadialSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve angle values from the data. */
    angleKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve radius values from the data. */
    radiusKey: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgRadialSeriesOptionsNames {
    /** A human-readable description of the angle values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    angleName?: string;
    /** A human-readable description of the radius values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    radiusName?: string;
}

export type AgRadialSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgRadialSeriesOptionsKeys<TDatum> &
    AgRadialSeriesOptionsNames;

export interface AgRadialSeriesTooltipRendererParams<TDatum, TContext = TContextDefault>
    extends AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgRadialSeriesOptionsKeys<TDatum>,
        AgRadialSeriesOptionsNames,
        AgRadialSeriesStyle {}

export type AgRadialSeriesItemStylerParams<
    TDatum = TDatumDefault,
    TContext = TContextDefault,
> = DatumCallbackParams<TDatum> &
    ContextCallbackParams<TContext> &
    AgRadialSeriesOptionsKeys<TDatum> &
    Required<AgRadialSeriesStyle>;

export interface AgRadialSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Apply rounded corners to each bar. */
    cornerRadius?: PixelSize;
}
