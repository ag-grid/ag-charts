import type { DatumCallbackParams } from '../../chart/callbackOptions';
import type { AgChartLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Opacity, PixelSize } from '../../chart/types';
import type { AgBaseCartesianThemeableOptions, AgBaseSeriesOptions } from '../seriesOptions';
import type { FillOptions, LineDashOptions, StrokeOptions } from './commonOptions';

export interface AgConeFunnelSeriesLabelOptions<TDatum, TParams> extends AgChartLabelOptions<TDatum, TParams> {
    /** Spacing between label and the associated divider. */
    spacing?: PixelSize;
    /** The placement of the label in relation to the divider between connectors. */
    placement?: 'before' | 'middle' | 'after';
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

export interface AgConeFunnelSeriesThemeableOptions<TDatum = any> extends AgBaseCartesianThemeableOptions<TDatum> {
    /** The colours to cycle through for the fills of the connectors. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the connectors. */
    strokes?: CssColor[];
    /** The opacity of the fill for the connectors. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the connectors. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the connectors. */
    strokeWidth?: PixelSize;
    /**
     * Bar rendering direction.
     *
     * __Note:__ This option affects the layout direction of X and Y data values.
     */
    direction?: 'horizontal' | 'vertical';
    /** Configuration for the labels shown on between connectors. */
    label?: AgConeFunnelSeriesLabelOptions<TDatum, AgConeFunnelSeriesLabelFormatterParams>;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgConeFunnelSeriesTooltipRendererParams>;
}

export interface AgConeFunnelSeriesOptionsKeys {
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey: string;
}

export interface AgConeFunnelSeriesOptionsNames {
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** Human-readable description of the y-values. If supplied, a corresponding `yName` will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** Human-readable description of the y-values. If supplied, matching items with the same value will be toggled together. */
    legendItemName?: string;
}

export interface AgConeFunnelSeriesOptions<TDatum = any>
    extends AgBaseSeriesOptions<TDatum>,
        AgConeFunnelSeriesOptionsKeys,
        AgConeFunnelSeriesOptionsNames,
        AgConeFunnelSeriesThemeableOptions<TDatum> {
    /** Configuration for the Cone Funnel Series. */
    type: 'cone-funnel';
}
