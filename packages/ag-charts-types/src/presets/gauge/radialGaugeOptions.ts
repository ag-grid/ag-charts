import type { AgBaseAxisLabelOptions } from '../../chart/axisOptions';
import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type {
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    AgChartLabelOptions,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { Degree, MarkerShape, PixelSize, Ratio } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../../series/cartesian/commonOptions';
import type { AgBaseSeriesThemeableOptions } from '../../series/seriesOptions';
import type { AgGaugeColorStop, AgGaugeCornerMode, AgGaugeFillMode, AgGaugeSegmentation } from './commonOptions';

export type AgRadialGaugeTargetPlacement = 'inside' | 'outside' | 'middle';

export interface AgRadialGaugeLabelFormatterParams {}

export interface AgRadialGaugeItemStylerParams<TDatum = any>
    extends DatumCallbackParams<TDatum>,
        Required<AgRadialGaugeStyle> {}

export interface AgRadialGaugeScaleInterval {
    /** Array of values in axis units for specified intervals along the axis. The values in this array must be compatible with the axis type. */
    values?: number[];
    /** The axis interval. Expressed in the units of the axis. If the configured interval results in too many items given the chart size, it will be ignored. */
    step?: number;
}

export interface AgRadialGaugeScaleLabel extends AgBaseAxisLabelOptions {}

export interface AgRadialGaugeScale extends FillOptions, StrokeOptions, LineDashOptions {
    /** Configuration the colours. */
    fills?: AgGaugeColorStop[];
    /** Configuration the fill mode. */
    fillMode?: AgGaugeFillMode;
    /** Maximum value of the scale. Any values exceeding this number will be clipped to this maximum. */
    min?: number;
    /** Minimum value of the scale. Any values exceeding this number will be clipped to this minimum. */
    max?: number;
    /** Configuration for the axis labels, shown next to the ticks. */
    label?: AgRadialGaugeScaleLabel;
    /** Configuration for the ticks interval. */
    interval?: AgRadialGaugeScaleInterval;
}

export interface AgRadialGaugeTooltipRendererParams<TDatum> extends AgSeriesTooltipRendererParams<TDatum> {
    /** Value of the Gauge */
    value: number;
}

export interface AgRadialGaugeStyle {}

export interface AgRadialGaugeBarStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Whether the bar should be shown. */
    enabled?: boolean;
    /** Configuration the colours. */
    fills?: AgGaugeColorStop[];
    /** Configuration the fill mode. */
    fillMode?: AgGaugeFillMode;
}

export interface AgRadialGaugeNeedleStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Whether the needle should be shown. */
    enabled?: boolean;
    /** Ratio of the size of the needle. */
    radiusRatio?: number;
    /** Spacing between radiusRatio, in pixels. */
    spacing?: number;
}

export type AgRadialGaugeMarkerShape = MarkerShape | 'line';

export interface AgRadialGaugeTargetLabelOptions extends AgChartLabelOptions<never, never> {
    /** Spacing of the label. */
    spacing?: PixelSize;
}

export interface AgRadialGaugeTarget extends FillOptions, StrokeOptions, LineDashOptions {
    /** Value to use to position the target */
    value: number;
    /** Text to use for the target label. */
    text?: string;
    /** The shape to use for the target. You can also supply a custom marker by providing a `Marker` subclass. */
    shape?: AgRadialGaugeMarkerShape;
    /** Placement of target. */
    placement?: AgRadialGaugeTargetPlacement;
    /** Spacing of the target. Ignored when placement is 'middle'. */
    spacing?: PixelSize;
    /** Size of the target. */
    size?: PixelSize;
    /** Rotation of the target, in degrees. */
    rotation?: Degree;
    /** Label options for all targets. */
    label?: AgRadialGaugeTargetLabelOptions;
}

export interface AgRadialGaugeLabelOptions<TDatum>
    extends AgChartAutoSizedLabelOptions<TDatum, AgRadialGaugeLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgRadialGaugeSecondaryLabelOptions<TDatum>
    extends AgChartAutoSizedSecondaryLabelOptions<TDatum, AgRadialGaugeLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgRadialGaugeThemeableOptions<TDatum = any>
    extends AgRadialGaugeStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'data' | 'showInLegend'> {
    /** Ratio of the outer radius of the gauge. */
    outerRadius?: number;
    /** Ratio of the inner radius of the gauge. */
    innerRadius?: number;
    /** Ratio of the outer radius of the gauge. */
    outerRadiusRatio?: Ratio;
    /** Ratio of the inner radius of the gauge. */
    innerRadiusRatio?: Ratio;
    /** Angle in degrees of the start of the gauge. */
    startAngle?: Degree;
    /** Angle in degrees of the end of the gauge. */
    endAngle?: Degree;
    /** Configuration for a segmented appearance. */
    segmentation?: AgGaugeSegmentation;
    /** Apply rounded corners to the gauge. */
    cornerRadius?: number;
    /** Configuration on whether to apply `cornerRadius` only to the ends of the gauge, or each individual item within the gauge. */
    cornerMode?: AgGaugeCornerMode;
    /** Configuration for the needle. */
    needle?: AgRadialGaugeNeedleStyle;
    /** Configuration for the scale. */
    scale?: AgRadialGaugeScale;
    /** Configuration for the bar. */
    bar?: AgRadialGaugeBarStyle;
    /** Configuration for the labels shown inside the shape. */
    label?: AgRadialGaugeLabelOptions<TDatum>;
    /** Configuration for the labels shown inside the shape. */
    secondaryLabel?: AgRadialGaugeSecondaryLabelOptions<TDatum>;
    /** Distance between the shape edges and the text. */
    margin?: PixelSize;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgRadialGaugeTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Radial Gauge based on the input parameters. */
    itemStyler?: Styler<AgRadialGaugeItemStylerParams, AgRadialGaugeStyle>;
}

export interface AgRadialGaugePreset<TDatum = any> extends AgRadialGaugeThemeableOptions<TDatum> {
    /** Configuration for the Radial Gauge Series. */
    type: 'radial-gauge';
    /** Value of the Radial Gauge Series. */
    value: number;
    /** Configuration for the targets. */
    targets?: AgRadialGaugeTarget[];
}
