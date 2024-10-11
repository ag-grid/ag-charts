import type { AgBaseAxisLabelOptions } from '../../chart/axisOptions';
import type { DatumCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgConeFunnelSeriesLabelOptions<TDatum, TParams> extends AgChartLabelOptions<TDatum, TParams> {
    /** Spacing between label and the associated divider. */
    spacing?: PixelSize;
    /** The placement of the label in relation to the divider between drop-offs. */
    placement?: 'before' | 'middle' | 'after';
}

export interface AgConeFunnelSeriesStageLabelOptions extends AgBaseAxisLabelOptions {
    /** Placement of the label in relation to the chart */
    placement?: 'before' | 'after';
}

export interface AgConeFunnelSeriesItemStylerParams<TDatum>
    extends DatumCallbackParams<TDatum>,
        AgConeFunnelSeriesOptionsKeys,
        Required<AgConeFunnelSeriesStyle> {}

export interface AgConeFunnelSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export type AgConeFunnelSeriesLabelFormatterParams = AgConeFunnelSeriesOptionsKeys & AgConeFunnelSeriesOptionsNames;

export interface AgConeFunnelSeriesTooltipRendererParams<TDatum = any>
    extends AgConeFunnelSeriesOptionsKeys,
        AgConeFunnelSeriesOptionsNames,
        AgSeriesTooltipRendererParams<TDatum> {}

export interface AgConeFunnelSeriesThemeableOptions<TDatum = any>
    extends Omit<AgBaseCartesianThemeableOptions<TDatum>, 'showInLegend'>,
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
    label?: AgConeFunnelSeriesLabelOptions<TDatum, AgConeFunnelSeriesLabelFormatterParams>;
    /** Configuration for the stage labels. */
    stageLabel?: AgConeFunnelSeriesStageLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgConeFunnelSeriesTooltipRendererParams>;
}

export interface AgConeFunnelSeriesOptionsKeys {
    /** The key to use to retrieve stage values from the data. */
    stageKey: string;
    /** The key to use to retrieve values from the data. */
    valueKey: string;
}

export interface AgConeFunnelSeriesOptionsNames {}

export interface AgConeFunnelSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'showInLegend'>,
        AgConeFunnelSeriesOptionsKeys,
        AgConeFunnelSeriesOptionsNames,
        AgConeFunnelSeriesThemeableOptions<TDatum> {
    /** Configuration for the Cone Funnel Series. */
    type: 'cone-funnel';
}
