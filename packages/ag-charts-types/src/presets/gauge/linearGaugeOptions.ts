import type { AgBaseAxisLabelOptions } from '../../chart/axisOptions';
import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type {
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    AgChartLabelOptions,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { Degree, Direction, MarkerShape, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../../series/cartesian/commonOptions';
import type { AgBaseSeriesThemeableOptions } from '../../series/seriesOptions';
import type { AgGaugeColorStop, AgGaugeCornerMode, AgGaugeFillMode, AgGaugeSegmentation } from './gaugeCommonOptions';

export type AgLinearGaugeTargetPlacement = 'before' | 'after' | 'middle';

export interface AgLinearGaugeLabelFormatterParams {}

export interface AgLinearGaugeItemStylerParams<TDatum = any>
    extends DatumCallbackParams<TDatum>,
        Required<AgLinearGaugeStyle> {}

export interface AgLinearGaugeScaleInterval {
    /** Array of values in axis units for specified intervals along the axis. The values in this array must be compatible with the axis type. */
    values?: number[];
    /** The axis interval. Expressed in the units of the axis. If the configured interval results in too many items given the chart size, it will be ignored. */
    step?: number;
}

export interface AgLinearGaugeScaleLabel extends AgBaseAxisLabelOptions {
    /** Placement of labels */
    placement?: 'before' | 'after';
}

export interface AgLinearGaugeScale extends FillOptions, StrokeOptions, LineDashOptions {
    /** Configuration the colours. */
    fills?: AgGaugeColorStop[];
    /** Configuration the fill mode. */
    fillMode?: AgGaugeFillMode;
    /** Maximum value of the scale. Any values exceeding this number will be clipped to this maximum. */
    min?: number;
    /** Minimum value of the scale. Any values exceeding this number will be clipped to this minimum. */
    max?: number;
    /** Configuration for the axis labels, shown next to the ticks. */
    label?: AgLinearGaugeScaleLabel;
    /** Configuration for the ticks interval. */
    interval?: AgLinearGaugeScaleInterval;
}

export interface AgLinearGaugeTooltipRendererParams<TDatum> extends AgSeriesTooltipRendererParams<TDatum> {
    /** Value of the Gauge */
    value: number;
}

export interface AgLinearGaugeStyle {}

export interface AgLinearGaugeBarStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Whether the bar should be shown. */
    enabled?: boolean;
    /** Width of the bar, or the height if `horizontal` is true. Defaults to the gauge thickness. */
    thickness?: number;
    /** Thickness of the bar in proportion to the gauge thickness. Ignored if `thickness` is set. */
    thicknessRatio?: number;
    /** Configuration the colours. */
    fills?: AgGaugeColorStop[];
    /** Configuration the fill mode. */
    fillMode?: AgGaugeFillMode;
}

export interface AgLinearGaugeBackgroundStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export type AgLinearGaugeMarkerShape = MarkerShape | 'line';

export interface AgLinearGaugeTarget extends FillOptions, StrokeOptions, LineDashOptions {
    /** Value to use to position the target */
    value: number;
    /** Text to use for the target label. */
    text?: string;
    /** The shape to use for the target. You can also supply a custom marker by providing a `Marker` subclass. */
    shape?: AgLinearGaugeMarkerShape;
    /** Placement of target. */
    placement?: AgLinearGaugeTargetPlacement;
    /** Spacing of the target. Ignored when placement is 'middle'. */
    spacing?: PixelSize;
    /** Size of the target. */
    size?: PixelSize;
    /** Rotation of the target, in degrees. */
    rotation?: Degree;
}

export interface AgLinearGaugeTargetLabelOptions extends AgChartLabelOptions<never, never> {
    /** Spacing of the label. */
    spacing?: PixelSize;
}

export interface AgLinearGaugeTargetOptions extends FillOptions, StrokeOptions, LineDashOptions {
    /** The shape to use for the target. You can also supply a custom marker by providing a `Marker` subclass. */
    shape?: AgLinearGaugeMarkerShape;
    /** Placement of target. */
    placement?: AgLinearGaugeTargetPlacement;
    /** Spacing of the target. Ignored when placement is 'middle'. */
    spacing?: PixelSize;
    /** Size of the target. */
    size?: PixelSize;
    /** Rotation of the target, in degrees. */
    rotation?: Degree;
    /** Label options for all targets. */
    label?: AgLinearGaugeTargetLabelOptions;
}

export interface AgLinearGaugeLabelOptions<TDatum>
    extends AgChartAutoSizedLabelOptions<TDatum, AgLinearGaugeLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgLinearGaugeSecondaryLabelOptions<TDatum>
    extends AgChartAutoSizedSecondaryLabelOptions<TDatum, AgLinearGaugeLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgLinearGaugeThemeableOptions<TDatum = any>
    extends AgLinearGaugeStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'showInLegend'> {
    /** Direction to display the gauge in. */
    direction?: Direction;
    /** Width of the gauge, or the height if `direction` is `horizontal`. */
    thickness?: number;
    /** Configuration for a segmented appearance. */
    segmentation?: AgGaugeSegmentation;
    /** Apply rounded corners to the gauge. */
    cornerRadius?: number;
    /** Configuration on whether to apply `cornerRadius` only to the ends of the gauge, or each individual item within the gauge. */
    cornerMode?: AgGaugeCornerMode;
    /** Configuration for all targets. */
    target?: AgLinearGaugeTargetOptions;
    /** Configuration for the bar. */
    bar?: AgLinearGaugeBarStyle;
    /** Configuration for the background. */
    background?: AgLinearGaugeBackgroundStyle;
    /** Configuration for the labels shown inside the shape. */
    label?: AgLinearGaugeLabelOptions<TDatum>;
    /** Configuration for the labels shown inside the shape. */
    secondaryLabel?: AgLinearGaugeSecondaryLabelOptions<TDatum>;
    /** Distance between the shape edges and the text. */
    margin?: PixelSize;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgLinearGaugeTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Linear Gauge based on the input parameters. */
    itemStyler?: Styler<AgLinearGaugeItemStylerParams, AgLinearGaugeStyle>;
}

export interface AgLinearGaugePreset<TDatum = any> extends AgLinearGaugeThemeableOptions<TDatum> {
    /** Configuration for the Linear Gauge Series. */
    type: 'linear-gauge';
    /** Value of the Linear Gauge Series. */
    value: number;
    /** Scale of the Linear Gauge Series. */
    scale?: AgLinearGaugeScale;
    /** Configuration for the targets. */
    targets?: AgLinearGaugeTarget[];
}
