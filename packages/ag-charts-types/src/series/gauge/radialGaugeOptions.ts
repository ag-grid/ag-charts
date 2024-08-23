import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type { AgChartAutoSizedLabelOptions, AgChartAutoSizedSecondaryLabelOptions } from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, MarkerShape, PixelSize, Ratio } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgRadialGaugeSeriesScale {
    min?: number;
    max?: number;
    values?: number[];
}
export interface AgRadialGaugeSeriesTooltipRendererParams<TDatum>
    extends AgSeriesTooltipRendererParams<TDatum>,
        AgRadialGaugeSeriesOptionsKeys,
        AgRadialGaugeSeriesOptionsNames {
    value: number;
}

export interface AgRadialGaugeSeriesHighlightStyle<_TDatum>
    extends AgSeriesHighlightStyle,
        FillOptions,
        StrokeOptions {}

export interface AgRadialGaugeSeriesStyle {}

export interface AgRadialGaugeSeriesBarStyle extends FillOptions, StrokeOptions, LineDashOptions {
    enabled?: boolean;
}

export interface AgRadialGaugeSeriesBackgroundStyle extends FillOptions, StrokeOptions, LineDashOptions {}

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

export interface AgRadialGaugeLabelOptions<TDatum>
    extends AgChartAutoSizedLabelOptions<TDatum, AgRadialGaugeSeriesLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}
export interface AgRadialGaugeSecondaryLabelOptions<TDatum>
    extends AgChartAutoSizedSecondaryLabelOptions<TDatum, AgRadialGaugeSeriesLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgRadialGaugeColorStop {
    stop?: number;
    color: CssColor;
}

export interface AgRadialGaugeTarget extends FillOptions, StrokeOptions, LineDashOptions {
    value: number;
    shape?: MarkerShape;
    radiusRatio: Ratio;
    sizeRatio: Ratio;
    rotation: number;
}

export interface AgRadialGaugeSeriesThemeableOptions<TDatum = any>
    extends AgRadialGaugeSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    outerRadiusRatio?: number;
    innerRadiusRatio?: number;
    startAngle?: number;
    endAngle?: number;
    sectorSpacing?: number;
    cornerRadius?: number;
    itemMode?: 'continuous' | 'segmented';
    cornerMode?: 'container' | 'item';
    colorStops?: AgRadialGaugeColorStop[];
    targets?: AgRadialGaugeTarget[];
    /** Configuration for the needle. */
    needle?: AgRadialGaugeSeriesNeedleStyle;
    /** Configuration for the bar. */
    bar?: AgRadialGaugeSeriesBarStyle;
    /** Configuration for the background. */
    background?: AgRadialGaugeSeriesBackgroundStyle;
    /** Configuration for the labels shown inside the shape. */
    label?: AgRadialGaugeLabelOptions<TDatum>;
    /** Configuration for the labels shown inside the shape. */
    secondaryLabel?: AgRadialGaugeSecondaryLabelOptions<TDatum>;
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
    scale?: AgRadialGaugeSeriesScale;
}
