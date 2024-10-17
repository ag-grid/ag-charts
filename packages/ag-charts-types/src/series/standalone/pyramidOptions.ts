import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions } from '../seriesOptions';

export interface AgPyramidSeriesLabelOptions<TDatum, TParams> extends AgChartLabelOptions<TDatum, TParams> {}

export interface AgPyramidSeriesStageLabelOptions extends AgChartLabelOptions<never, never> {
    /** Placement of the label in relation to the chart. */
    placement?: 'before' | 'after';
    /** Spacing of the label in relation to the chart. */
    spacing?: number;
}

export interface AgPyramidSeriesItemStylerParams<TDatum>
    extends DatumCallbackParams<TDatum>,
        AgPyramidSeriesOptionsKeys,
        Required<AgPyramidSeriesStyle> {}

export interface AgPyramidSeriesStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export type AgPyramidSeriesLabelFormatterParams = AgPyramidSeriesOptionsKeys & AgPyramidSeriesOptionsNames;

export interface AgPyramidSeriesTooltipRendererParams<TDatum = any>
    extends AgPyramidSeriesOptionsKeys,
        AgPyramidSeriesOptionsNames,
        AgSeriesTooltipRendererParams<TDatum> {}

export interface AgPyramidSeriesThemeableOptions<TDatum = any> extends LineDashOptions {
    /** The colours to cycle through for the fills of the stages. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the stages. */
    strokes?: CssColor[];
    /** The opacity of the fill for the stages. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the stages. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the stages. */
    strokeWidth?: PixelSize;
    /** Stage rendering direction. */
    direction?: 'horizontal' | 'vertical';
    /** Reverse the order of the stages. */
    reverse?: boolean;
    /** Spacing between the stages. */
    spacing?: number;
    /** Ratio of the triangle width to its height. When unset, the triangle will fill the available space. */
    aspectRatio?: number;
    /** Configuration for the labels shown on stages. */
    label?: AgPyramidSeriesLabelOptions<TDatum, AgPyramidSeriesLabelFormatterParams>;
    /** Configuration for the stage labels. */
    stageLabel?: AgPyramidSeriesStageLabelOptions;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgPyramidSeriesTooltipRendererParams>;
    /** Function used to return formatting for individual bars, based on the given parameters. If the current bar is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgPyramidSeriesItemStylerParams<TDatum>, AgPyramidSeriesStyle>;
}

export interface AgPyramidSeriesOptionsKeys {
    /** The key to use to retrieve stage values from the data. */
    stageKey: string;
    /** The key to use to retrieve values from the data. */
    valueKey: string;
}

export interface AgPyramidSeriesOptionsNames {}

export interface AgPyramidSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'showInLegend'>,
        AgPyramidSeriesOptionsKeys,
        AgPyramidSeriesOptionsNames,
        AgPyramidSeriesThemeableOptions<TDatum> {
    /** Configuration for the Funnel Series. */
    type: 'pyramid';
}
