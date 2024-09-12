import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type {
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    AgChartLabelOptions,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { Degree, Direction, MarkerShape, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../../series/cartesian/commonOptions';
import type {
    AgBaseGaugeThemeableOptions,
    AgGaugeCornerMode,
    AgGaugeScaleLabel,
    AgGaugeSegmentation,
    FillsOptions,
    GaugeDatum,
} from './commonOptions';

export type AgLinearGaugeTargetPlacement = 'before' | 'after' | 'middle';

export interface AgLinearGaugeLabelFormatterParams {}

export interface AgLinearGaugeItemStylerParams extends DatumCallbackParams<GaugeDatum>, Required<AgLinearGaugeStyle> {}

export interface AgLinearGaugeScaleInterval {
    /** Array of values in scale units for specified intervals along the scale. The values in this array must be compatible with the scale type. */
    values?: number[];
    /** The scale interval. Expressed in the units of the scale. If the configured interval results in too many items given the chart size, it will be ignored. */
    step?: number;
}

export interface AgLinearGaugeScaleLabel extends AgGaugeScaleLabel {
    /** Placement of labels */
    placement?: 'before' | 'after';
}

export interface AgLinearGaugeScale extends FillsOptions, FillOptions, StrokeOptions, LineDashOptions {
    /** Maximum value of the scale. Any values exceeding this number will be clipped to this maximum. */
    min?: number;
    /** Minimum value of the scale. Any values exceeding this number will be clipped to this minimum. */
    max?: number;
    /** Configuration for the scale labels. */
    label?: AgLinearGaugeScaleLabel;
    /** Configuration for the ticks interval. */
    interval?: AgLinearGaugeScaleInterval;
}

export interface AgLinearGaugeTooltipRendererParams extends AgSeriesTooltipRendererParams<undefined> {
    /** Value of the Gauge */
    value: number;
}

export interface AgLinearGaugeStyle {}

export interface AgLinearGaugeBarStyle extends FillsOptions, FillOptions, StrokeOptions, LineDashOptions {
    /** Whether the bar should be shown. */
    enabled?: boolean;
    /** Width of the bar, or the height if `horizontal` is true. Defaults to the gauge thickness. */
    thickness?: number;
    /** Thickness of the bar in proportion to the gauge thickness. Ignored if `thickness` is set. */
    thicknessRatio?: number;
}

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

export interface AgLinearGaugeTargetLabelOptions extends AgChartLabelOptions<undefined, never> {
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

export interface AgLinearGaugeLabelOptions
    extends AgChartAutoSizedLabelOptions<never, AgLinearGaugeLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgLinearGaugeSecondaryLabelOptions
    extends AgChartAutoSizedSecondaryLabelOptions<never, AgLinearGaugeLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgLinearGaugeThemeableOptions extends AgLinearGaugeStyle, AgBaseGaugeThemeableOptions {
    /** Direction to display the gauge in. */
    direction?: Direction;
    /** Width of the gauge, or the height if `direction` is `horizontal`. */
    thickness?: number;
    /** Configuration for a segmented appearance. */
    segmentation?: AgGaugeSegmentation;
    /** Apply rounded corners to the gauge. */
    cornerRadius?: number;
    /**
     * Configuration on whether to apply `cornerRadius` only to the ends of the gauge, or each individual item within the gauge.
     *
     * Default: `container`
     **/
    cornerMode?: AgGaugeCornerMode;
    /** Configuration for all targets. */
    target?: AgLinearGaugeTargetOptions;
    /** Configuration for the bar. */
    bar?: AgLinearGaugeBarStyle;
    // /** Configuration for the labels shown inside the shape. */
    // label?: AgLinearGaugeLabelOptions;
    // /** Configuration for the labels shown inside the shape. */
    // secondaryLabel?: AgLinearGaugeSecondaryLabelOptions;
    // /** Distance between the shape edges and the text. */
    // spacing?: PixelSize;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgLinearGaugeTooltipRendererParams>;
    /** A callback function for adjusting the styles of a particular Linear Gauge based on the input parameters. */
    itemStyler?: Styler<AgLinearGaugeItemStylerParams, AgLinearGaugeStyle>;
}

export interface AgLinearGaugePreset extends AgLinearGaugeThemeableOptions {
    /** Configuration for the Linear Gauge. */
    type: 'linear-gauge';
    /** Value of the Linear Gauge. */
    value: number;
    /** Scale of the Linear Gauge. */
    scale?: AgLinearGaugeScale;
    /** Configuration for the targets. */
    targets?: AgLinearGaugeTarget[];
}
