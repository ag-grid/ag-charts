import type { AgBaseAxisLabelOptions } from '../../chart/axisOptions';
import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type {
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    AgChartLabelOptions,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Degree, MarkerShape, PixelSize } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export type AgLinearGaugeTargetPlacement = 'before' | 'after' | 'middle';

export interface AgLinearGaugeSeriesLabelFormatterParams
    extends AgLinearGaugeSeriesOptionsKeys,
        AgLinearGaugeSeriesOptionsNames {}

export interface AgLinearGaugeSeriesItemStylerParams<TDatum = any>
    extends DatumCallbackParams<TDatum>,
        AgLinearGaugeSeriesOptionsKeys,
        Required<AgLinearGaugeSeriesStyle> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface AgLinearGaugeSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle {}

export interface AgLinearGaugeSeriesOptionsKeys {}

export interface AgLinearGaugeSeriesOptionsNames {}

export interface AgLinearGaugeSeriesScaleInterval {
    /** Array of values in axis units for specified intervals along the axis. The values in this array must be compatible with the axis type. */
    values?: number[];
    /** The axis interval. Expressed in the units of the axis. If the configured interval results in too many items given the chart size, it will be ignored. */
    step?: number;
}

export interface AgLinearGaugeSeriesScaleLabel extends AgBaseAxisLabelOptions {
    /** Placement of labels */
    placement?: 'before' | 'after';
}

export interface AgLinearGaugeSeriesScale extends FillOptions, StrokeOptions, LineDashOptions {
    /** Configuration the colours. */
    colorRange?: CssColor[];
    /** Maximum value of the scale. Any values exceeding this number will be clipped to this maximum. */
    min?: number;
    /** Minimum value of the scale. Any values exceeding this number will be clipped to this minimum. */
    max?: number;
    /** Configuration for the axis labels, shown next to the ticks. */
    label?: AgLinearGaugeSeriesScaleLabel;
    /** Configuration for the ticks interval. */
    interval?: AgLinearGaugeSeriesScaleInterval;
}

export interface AgLinearGaugeSeriesTooltipRendererParams<TDatum>
    extends AgSeriesTooltipRendererParams<TDatum>,
        AgLinearGaugeSeriesOptionsKeys,
        AgLinearGaugeSeriesOptionsNames {
    /** Value of the Gauge */
    value: number;
}

export interface AgLinearGaugeSeriesStyle {
    /** Apply rounded corners to the gauge. */
    cornerRadius?: number;
}

export interface AgLinearGaugeSeriesBarStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Whether the bar should be shown. */
    enabled?: boolean;
    /** Configuration the colours. */
    colorRange?: CssColor[];
}

export interface AgLinearGaugeSeriesBackgroundStyle extends FillOptions, StrokeOptions, LineDashOptions {}

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
    extends AgChartAutoSizedLabelOptions<TDatum, AgLinearGaugeSeriesLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgLinearGaugeSecondaryLabelOptions<TDatum>
    extends AgChartAutoSizedSecondaryLabelOptions<TDatum, AgLinearGaugeSeriesLabelFormatterParams> {
    /** Text to always display. */
    text?: string;
}

export interface AgLinearGaugeSeriesThemeableOptions<TDatum = any>
    extends AgLinearGaugeSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** Display the gauge horizontally. */
    horizontal?: boolean;
    /** Width of the gauge, or the height if `horizontal` is true. */
    thickness?: number;
    /** Configuration for a segmented appearance. */
    segments?: number[] | number;
    /** The spacing between bars. */
    barSpacing?: number;
    /** Configuration on whether to apply `cornerRadius` only to the ends of the gauge, or each individual item within the gauge. */
    cornerMode?: 'container' | 'item';
    /** Configuration for all targets. */
    target?: AgLinearGaugeTargetOptions;
    /** Configuration for the bar. */
    bar?: AgLinearGaugeSeriesBarStyle;
    /** Configuration for the background. */
    background?: AgLinearGaugeSeriesBackgroundStyle;
    /** Configuration for the labels shown inside the shape. */
    label?: AgLinearGaugeLabelOptions<TDatum>;
    /** Configuration for the labels shown inside the shape. */
    secondaryLabel?: AgLinearGaugeSecondaryLabelOptions<TDatum>;
    /** Distance between the shape edges and the text. */
    margin?: PixelSize;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgLinearGaugeSeriesTooltipRendererParams<TDatum>>;
    /** A callback function for adjusting the styles of a particular Linear Gauge based on the input parameters. */
    itemStyler?: Styler<AgLinearGaugeSeriesItemStylerParams, AgLinearGaugeSeriesStyle>;
    /** Style overrides when a node is hovered. */
    highlightStyle?: AgLinearGaugeSeriesHighlightStyle<TDatum>;
}

export interface AgLinearGaugeSeriesOptions<TDatum = any>
    extends Omit<AgBaseSeriesOptions<TDatum>, 'highlightStyle'>,
        AgLinearGaugeSeriesOptionsKeys,
        AgLinearGaugeSeriesOptionsNames,
        AgLinearGaugeSeriesThemeableOptions<TDatum> {
    /** Configuration for the Linear Gauge Series. */
    type: 'linear-gauge';
    /** Value of the Linear Gauge Series. */
    value: number;
    /** Scale of the Linear Gauge Series. */
    scale?: AgLinearGaugeSeriesScale;
    /** Configuration for the targets. */
    targets?: AgLinearGaugeTarget[];
}
