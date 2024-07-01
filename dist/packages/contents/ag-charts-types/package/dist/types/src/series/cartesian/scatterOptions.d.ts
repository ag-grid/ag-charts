import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgErrorBarOptions, AgErrorBarThemeableOptions } from '../../chart/errorBarOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { LabelPlacement } from '../../chart/types';
import type { AgSeriesMarkerStyle } from '../markerOptions';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { AgErrorBoundSeriesTooltipRendererParams } from './cartesianSeriesTooltipOptions';
export interface AgScatterSeriesTooltipRendererParams<TDatum = any> extends AgSeriesTooltipRendererParams<TDatum>, AgScatterSeriesOptionsKeys, AgScatterSeriesOptionsNames, AgErrorBoundSeriesTooltipRendererParams {
}
export type AgScatterSeriesLabelFormatterParams = AgScatterSeriesOptionsKeys & AgScatterSeriesOptionsNames;
export type AgScatterSeriesItemStylerParams<TDatum> = DatumCallbackParams<TDatum> & AgScatterSeriesOptionsKeys & Required<AgSeriesMarkerStyle>;
export interface AgScatterSeriesLabel<TDatum> extends AgChartLabelOptions<TDatum, AgScatterSeriesLabelFormatterParams> {
    /**
     * Placement of label in relation to the marker.
     *
     * Default: `top`
     */
    placement?: LabelPlacement;
}
export interface AgScatterSeriesThemeableOptions<TDatum = any> extends AgBaseCartesianThemeableOptions<TDatum>, AgSeriesMarkerStyle {
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Configuration for the labels shown on top of data points. */
    label?: AgScatterSeriesLabel<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgScatterSeriesTooltipRendererParams<TDatum>>;
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgScatterSeriesItemStylerParams<TDatum>, AgSeriesMarkerStyle>;
    /** Configuration for the Error Bars. */
    errorBar?: AgErrorBarThemeableOptions;
}
export interface AgScatterSeriesOptionsKeys {
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
    /** The key to use to retrieve values from the data to use as labels for the markers. */
    labelKey?: string;
}
export interface AgScatterSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    labelName?: string;
}
export interface AgScatterSeriesOptions<TDatum = any> extends AgBaseSeriesOptions<TDatum>, AgScatterSeriesOptionsKeys, AgScatterSeriesOptionsNames, AgScatterSeriesThemeableOptions<TDatum> {
    /** Configuration for the Scatter Series. */
    type: 'scatter';
    /** Configuration for the Error Bars. */
    errorBar?: AgErrorBarOptions<TDatum>;
}
