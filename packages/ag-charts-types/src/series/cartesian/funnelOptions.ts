import type { ContextCallbackParams, DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgNumericAxisFormattableLabelOptions } from '../../chart/axisOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize, Ratio, TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgFunnelSeriesLabelOptions<TDatum, TParams, TContext = TContextDefault>
    extends AgChartLabelOptions<TDatum, TParams, TContext> {}

export interface AgFunnelSeriesStageLabelOptions<TContext> extends AgNumericAxisFormattableLabelOptions<TContext> {
    /** Placement of the label in relation to the chart. */
    placement?: 'before' | 'after';
}

export interface AgFunnelSeriesItemStylerParams<TDatum = TDatumDefault, TContext = TContextDefault>
    extends DatumCallbackParams<TDatum>,
        ContextCallbackParams<TContext>,
        AgFunnelSeriesOptionsKeys<TDatum>,
        Required<AgFunnelSeriesStyle> {}

export interface AgFunnelSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgFunnelSeriesLabelFormatterParams<TDatum = TDatumDefault> extends AgFunnelSeriesOptionsKeys<TDatum> {}

export interface AgFunnelSeriesTooltipRendererParams<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgFunnelSeriesOptionsKeys<TDatum>,
        AgFunnelSeriesOptionsNames,
        AgSeriesTooltipRendererParams<TDatum, TContext>,
        AgFunnelSeriesStyle {}

export interface AgFunnelSeriesDropOff extends FillOptions, StrokeOptions, LineDashOptions {
    /** Whether to draw drop-offs between adjacent bars. */
    enabled?: boolean;
}

export interface AgFunnelSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends Omit<AgBaseCartesianThemeableOptions<TDatum, TContext>, 'showInLegend'>,
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
    label?: AgFunnelSeriesLabelOptions<TDatum, AgFunnelSeriesLabelFormatterParams<TDatum>, TContext>;
    /** Configuration for the stage labels. */
    stageLabel?: AgFunnelSeriesStageLabelOptions<TContext>;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgFunnelSeriesTooltipRendererParams<TDatum, TContext>>;
    /** Function used to return formatting for individual bars, based on the given parameters. If the current bar is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgFunnelSeriesItemStylerParams<TDatum, TContext>, AgFunnelSeriesStyle>;
}

export interface AgFunnelSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve stage values from the data. */
    stageKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve values from the data. */
    valueKey: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgFunnelSeriesOptionsNames {}

export interface AgFunnelSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgFunnelSeriesOptionsKeys<TDatum>,
        AgFunnelSeriesOptionsNames,
        AgFunnelSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Funnel Series. */
    type: 'funnel';
}
