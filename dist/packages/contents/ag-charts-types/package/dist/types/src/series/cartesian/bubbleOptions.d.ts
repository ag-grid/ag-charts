import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { LabelPlacement, PixelSize } from '../../chart/types';
import type { AgSeriesMarkerStyle } from '../markerOptions';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
export type AgBubbleSeriesTooltipRendererParams<TDatum = any> = AgSeriesTooltipRendererParams<TDatum> & AgBubbleSeriesOptionsKeys & AgBubbleSeriesOptionsNames;
export type AgBubbleSeriesLabelFormatterParams = AgBubbleSeriesOptionsKeys & AgBubbleSeriesOptionsNames;
export interface AgBubbleSeriesLabel<TDatum> extends AgChartLabelOptions<TDatum, AgBubbleSeriesLabelFormatterParams> {
    /**
     * Placement of label in relation to the marker.
     *
     * Default: `top`
     */
    placement?: LabelPlacement;
}
export type AgBubbleSeriesStyle = AgSeriesMarkerStyle;
export type BubbleSeriesItemStylerParams<TDatum> = DatumCallbackParams<TDatum> & AgBubbleSeriesOptionsKeys & Required<AgBubbleSeriesStyle>;
export interface AgBubbleSeriesThemeableOptions<TDatum = any> extends AgBubbleSeriesStyle, AgBaseCartesianThemeableOptions<TDatum> {
    /** Explicitly specifies the extent of the domain for series `sizeKey`. */
    domain?: [number, number];
    /** Determines the smallest size a marker can be in pixels. */
    size?: PixelSize;
    /** Determines the largest size a marker can be in pixels. */
    maxSize?: PixelSize;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Configuration for the labels shown on top of data points. */
    label?: AgBubbleSeriesLabel<TDatum>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgBubbleSeriesTooltipRendererParams<TDatum>>;
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<BubbleSeriesItemStylerParams<TDatum>, AgBubbleSeriesStyle>;
}
export interface AgBubbleSeriesOptionsKeys {
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
    /** The key to use to retrieve size values from the data, used to control the size of the markers. */
    sizeKey: string;
    /** The key to use to retrieve values from the data to use as labels for the markers. */
    labelKey?: string;
}
export interface AgBubbleSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** A human-readable description of the size values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    sizeName?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    labelName?: string;
}
export interface AgBubbleSeriesOptions<TDatum = any> extends AgBaseSeriesOptions<TDatum>, AgBubbleSeriesThemeableOptions<TDatum>, AgBubbleSeriesOptionsKeys, AgBubbleSeriesOptionsNames {
    /** Configuration for Bubble Series. */
    type: 'bubble';
}
