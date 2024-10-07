import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions } from '../seriesOptions';

export interface AgPyramidSeriesLabelOptions<TDatum, TParams> extends AgChartLabelOptions<TDatum, TParams> {}

export interface AgPyramidSeriesStageLabelOptions extends AgChartLabelOptions<never, never> {
    /** Placement of the label in relation to the chart */
    placement?: 'before' | 'after';
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
    /**
     * Bar rendering direction.
     *
     * __Note:__ This option affects the layout direction of X and Y data values.
     */
    direction?: 'horizontal' | 'vertical';
    /** Reverse the order of the polygons. */
    reverse?: boolean;
    /** Spacing between the polygons. */
    spacing?: number;
    /** Configuration for the labels shown on polygons. */
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
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
}

export interface AgPyramidSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** Human-readable description of the y-values. If supplied, a corresponding `yName` will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
}

export interface AgPyramidSeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgPyramidSeriesOptionsKeys,
        AgPyramidSeriesOptionsNames,
        AgPyramidSeriesThemeableOptions<TDatum> {
    /** Configuration for the Funnel Series. */
    type: 'pyramid';
}
