import type { ContextCallbackParams, DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgErrorBarOptions, AgErrorBarThemeableOptions } from '../../chart/errorBarOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { LabelPlacement, TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgSeriesMarkerStyle } from '../markerOptions';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AgErrorBoundSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
import type { FillOptions, StrokeOptions } from './commonOptions';

export interface AgScatterSeriesTooltipRendererParams<TDatum = TDatumDefault>
    extends AgSeriesTooltipRendererParams<TDatum>,
        AgScatterSeriesOptionsKeys<TDatum>,
        AgScatterSeriesOptionsNames,
        AgErrorBoundSeriesTooltipRendererParams<TDatum>,
        FillOptions,
        StrokeOptions {}

export type AgScatterSeriesLabelFormatterParams<TDatum = TDatumDefault> = AgScatterSeriesOptionsKeys<TDatum> &
    AgScatterSeriesOptionsNames;

export type AgScatterSeriesItemStylerParams<
    TDatum = TDatumDefault,
    TContext = TContextDefault,
> = DatumCallbackParams<TDatum> &
    ContextCallbackParams<TContext> &
    AgScatterSeriesOptionsKeys<TDatum> &
    Required<AgSeriesMarkerStyle>;

export interface AgScatterSeriesLabel<TDatum>
    extends AgChartLabelOptions<TDatum, AgScatterSeriesLabelFormatterParams<TDatum>> {
    /**
     * Placement of label in relation to the marker.
     *
     * Default: `top`
     */
    placement?: LabelPlacement;
}

export interface AgScatterSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseCartesianThemeableOptions<TDatum, TContext>,
        AgSeriesMarkerStyle {
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Configuration for the labels shown on top of data points. */
    label?: AgScatterSeriesLabel<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgScatterSeriesTooltipRendererParams<TDatum>>;
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgScatterSeriesItemStylerParams<TDatum, TContext>, AgSeriesMarkerStyle>;
    /** Configuration for the Error Bars. */
    errorBar?: AgErrorBarThemeableOptions;
}

export interface AgScatterSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve x-values from the data. */
    xKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-values from the data. */
    yKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve values from the data to use as labels for the markers. */
    labelKey?: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgScatterSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    labelName?: string;
}

export interface AgScatterSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgScatterSeriesOptionsKeys<TDatum>,
        AgScatterSeriesOptionsNames,
        AgScatterSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Scatter Series. */
    type: 'scatter';
    /** Configuration for the Error Bars. */
    errorBar?: AgErrorBarOptions<TDatum, TContext>;
}
