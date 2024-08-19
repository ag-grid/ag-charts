import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartAutoSizedLabelOptions, AgChartAutoSizedSecondaryLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgRadialGaugeSeriesTooltipRendererParams<TDatum>
    extends AgSeriesTooltipRendererParams<TDatum>,
        AgRadialGaugeSeriesOptionsKeys,
        AgRadialGaugeSeriesOptionsNames {}

export interface AgRadialGaugeSeriesHighlightStyle<_TDatum>
    extends AgSeriesHighlightStyle,
        FillOptions,
        StrokeOptions {}

export interface AgRadialGaugeSeriesStyle {}

export interface AgRadialGaugeSeriesForegroundStyle extends FillOptions, StrokeOptions, LineDashOptions {
    enabled?: boolean;
}

export interface AgRadialGaugeSeriesBackgroundStyle extends FillOptions, StrokeOptions, LineDashOptions {
    enabled?: boolean;
}

export interface AgRadialGaugeSeriesNeedleStyle extends FillOptions, StrokeOptions, LineDashOptions {
    enabled?: boolean;
    shape?: 'needle';
    radiusRatio?: number;
    spacing?: number;
}

export interface AgRadialGaugeSeriesLabelFormatterParams
    extends AgRadialGaugeSeriesOptionsKeys,
        AgRadialGaugeSeriesOptionsNames {}

export interface AgRadialGaugeSeriesItemStylerParams<TDatum = any>
    extends DatumCallbackParams<TDatum>,
        AgRadialGaugeSeriesOptionsKeys,
        Required<AgRadialGaugeSeriesStyle> {}

export interface AgRadialGaugeSeriesOptionsKeys {}

export interface AgRadialGaugeSeriesOptionsNames {}

export interface AgChartRadialGaugeLabelOptions<TDatum>
    extends AgChartAutoSizedLabelOptions<TDatum, AgRadialGaugeSeriesLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}
export interface AgChartRadialGaugeSecondaryLabelOptions<TDatum>
    extends AgChartAutoSizedSecondaryLabelOptions<TDatum, AgRadialGaugeSeriesLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgRadialGaugeSeriesThemeableOptions<TDatum = any>
    extends AgRadialGaugeSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** The colour range to interpolate the numeric colour domain (min and max `colorKey` values) into. */
    colorRange?: CssColor[];
    /** Configuration for the needle. */
    needle?: AgRadialGaugeSeriesNeedleStyle;
    /** Configuration for the foreground. */
    foreground?: AgRadialGaugeSeriesForegroundStyle;
    /** Configuration for the background. */
    background?: AgRadialGaugeSeriesBackgroundStyle;
    /** Configuration for the labels shown inside the shape. */
    label?: AgChartAutoSizedLabelOptions<TDatum, AgRadialGaugeSeriesLabelFormatterParams>;
    /** Configuration for the labels shown inside the shape. */
    secondaryLabel?: AgChartAutoSizedSecondaryLabelOptions<TDatum, AgRadialGaugeSeriesLabelFormatterParams>;
    /** Distance between the shape edges and the text. */
    padding?: PixelSize;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadialGaugeSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Radial Gauge based on the input parameters. */
    itemStyler?: Styler<AgRadialGaugeSeriesItemStylerParams, AgRadialGaugeSeriesStyle>;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgRadialGaugeSeriesHighlightStyle<TDatum>;
}

export interface AgRadialGaugeSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgRadialGaugeSeriesOptionsKeys,
        AgRadialGaugeSeriesOptionsNames,
        AgRadialGaugeSeriesThemeableOptions<TDatum> {
    /** Configuration for the Radial Gauge Series. */
    type: 'radial-gauge';
    /** Value of the series. */
    value: number;
    /** Range of the value. Defaults to [0, 1]. */
    range?: [number, number];
}
