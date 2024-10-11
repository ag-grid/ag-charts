import type { AgBaseAxisLabelOptions } from '../../chart/axisOptions';
import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize, Ratio } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgFunnelSeriesLabelOptions<TDatum, TParams> extends AgChartLabelOptions<TDatum, TParams> {}

export interface AgFunnelSeriesStageLabelOptions extends AgBaseAxisLabelOptions {
    /** Placement of the label in relation to the chart */
    placement?: 'before' | 'after';
}

export interface AgFunnelSeriesItemStylerParams<TDatum>
    extends DatumCallbackParams<TDatum>,
        AgFunnelSeriesOptionsKeys,
        Required<AgFunnelSeriesStyle> {}

export interface AgFunnelSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export type AgFunnelSeriesLabelFormatterParams = AgFunnelSeriesOptionsKeys & AgFunnelSeriesOptionsNames;

export interface AgFunnelSeriesTooltipRendererParams<TDatum = any>
    extends AgFunnelSeriesOptionsKeys,
        AgFunnelSeriesOptionsNames,
        AgSeriesTooltipRendererParams<TDatum> {}

export interface AgFunnelSeriesDropOff extends FillOptions, StrokeOptions, LineDashOptions {
    /** Whether to draw drop-offs between adjacent bars. */
    enabled?: boolean;
}

export interface AgFunnelSeriesThemeableOptions<TDatum = any>
    extends Omit<AgBaseCartesianThemeableOptions<TDatum>, 'showInLegend'>,
        LineDashOptions {
    /** The colours to cycle through for the fills of the bars. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the bars. */
    strokes?: CssColor[];
    /** The opacity of the fill for the bars. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the bars. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the bars. */
    strokeWidth?: PixelSize;
    /** The size of the gap between the categories as a proportion, between 0 and 1. This value is a fraction of the “step”, which is the interval between the start of a bar and the start of the next bar. */
    spacingRatio?: Ratio;
    /** Configuration for drop-offs between adjacent bars. */
    dropOff?: AgFunnelSeriesDropOff;
    /** Bar rendering direction. */
    direction?: 'horizontal' | 'vertical';
    /** Align bars to whole pixel values to remove anti-aliasing. */
    crisp?: boolean;
    /** Configuration for the labels shown on bars. */
    label?: AgFunnelSeriesLabelOptions<TDatum, AgFunnelSeriesLabelFormatterParams>;
    /** Configuration for the stage labels. */
    stageLabel?: AgFunnelSeriesStageLabelOptions;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgFunnelSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual bars, based on the given parameters. If the current bar is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<TDatum>, AgFunnelSeriesStyle>;
}

export interface AgFunnelSeriesOptionsKeys {
    /** The key to use to retrieve stage values from the data. */
    stageKey: string;
    /** The key to use to retrieve values from the data. */
    valueKey: string;
}

export interface AgFunnelSeriesOptionsNames {}

export interface AgFunnelSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'showInLegend'>,
        AgFunnelSeriesOptionsKeys,
        AgFunnelSeriesOptionsNames,
        AgFunnelSeriesThemeableOptions<TDatum> {
    /** Configuration for the Funnel Series. */
    type: 'funnel';
}
