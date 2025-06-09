import type { AgFormattableLabelOptions } from '../../chart/axisOptions';
import type { ContextCallbackParams, DatumCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize, TContextDefault, TDatumDefault } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgConeFunnelSeriesLabelOptions<TDatum, TParams> extends AgChartLabelOptions<TDatum, TParams> {
    /** Spacing between label and the associated divider. */
    spacing?: PixelSize;
    /** The placement of the label in relation to the divider between drop-offs. */
    placement?: 'before' | 'middle' | 'after';
}

export interface AgConeFunnelSeriesStageLabelOptions<TContext = TContextDefault>
    extends AgFormattableLabelOptions<TContext> {
    /** Placement of the label in relation to the chart. */
    placement?: 'before' | 'after';
}

export interface AgConeFunnelSeriesItemStylerParams<TDatum = TDatumDefault, TContext = TContextDefault>
    extends DatumCallbackParams<TDatum>,
        ContextCallbackParams<TContext>,
        AgConeFunnelSeriesOptionsKeys<TDatum>,
        Required<AgConeFunnelSeriesStyle> {}

export interface AgConeFunnelSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgConeFunnelSeriesLabelFormatterParams<TDatum = TDatumDefault>
    extends AgConeFunnelSeriesOptionsKeys<TDatum> {}

export interface AgConeFunnelSeriesTooltipRendererParams<TDatum = TDatumDefault>
    extends AgConeFunnelSeriesOptionsKeys<TDatum>,
        AgConeFunnelSeriesOptionsNames,
        AgSeriesTooltipRendererParams<TDatum>,
        AgConeFunnelSeriesStyle {}

export interface AgConeFunnelSeriesThemeableOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends Omit<AgBaseCartesianThemeableOptions<TDatum, TContext>, 'showInLegend'>,
        LineDashOptions {
    /** The colours to cycle through for the fills of the drop-offs. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the drop-offs. */
    strokes?: CssColor[];
    /** The opacity of the fill for the drop-offs. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the drop-offs. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the drop-offs. */
    strokeWidth?: PixelSize;
    /** Bar rendering direction. */
    direction?: 'horizontal' | 'vertical';
    /** Configuration for the labels shown on between drop-offs. */
    label?: AgConeFunnelSeriesLabelOptions<TDatum, AgConeFunnelSeriesLabelFormatterParams<TDatum>>;
    /** Configuration for the stage labels. */
    stageLabel?: AgConeFunnelSeriesStageLabelOptions<TContext>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgConeFunnelSeriesTooltipRendererParams<TDatum>>;
}

export interface AgConeFunnelSeriesOptionsKeys<TDatum = TDatumDefault> {
    /** The key to use to retrieve stage values from the data. */
    stageKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve values from the data. */
    valueKey: TDatum extends object ? keyof TDatum & string : string;
}

export interface AgConeFunnelSeriesOptionsNames {}

export interface AgConeFunnelSeriesOptions<TDatum = TDatumDefault, TContext = TContextDefault>
    extends AgBaseSeriesOptions<TDatum, TContext>,
        AgConeFunnelSeriesOptionsKeys<TDatum>,
        AgConeFunnelSeriesOptionsNames,
        AgConeFunnelSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the Cone Funnel Series. */
    type: 'cone-funnel';
}
