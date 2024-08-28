import type { AgBaseAxisLabelOptions } from '../../chart/axisOptions';
import type { DatumCallbackParams, Styler } from '../../chart/callbackOptions';
import type {
    AgChartAutoSizedLabelOptions,
    AgChartAutoSizedSecondaryLabelOptions,
    AgChartLabelOptions,
} from '../../chart/labelOptions';
import type { AgSeriesTooltip, AgSeriesTooltipRendererParams } from '../../chart/tooltipOptions';
import type { CssColor, Degree, MarkerShape, PixelSize, Ratio } from '../../chart/types';
import type { FillOptions, LineDashOptions, StrokeOptions } from '../cartesian/commonOptions';
import type { AgBaseSeriesOptions, AgBaseSeriesThemeableOptions, AgSeriesHighlightStyle } from '../seriesOptions';

export interface AgRadialGaugeSeriesLabelFormatterParams
    extends AgRadialGaugeSeriesOptionsKeys,
        AgRadialGaugeSeriesOptionsNames {}

export interface AgRadialGaugeSeriesItemStylerParams<TDatum = any>
    extends DatumCallbackParams<TDatum>,
        AgRadialGaugeSeriesOptionsKeys,
        Required<AgRadialGaugeSeriesStyle> {}

export interface AgRadialGaugeSeriesHighlightStyle<_TDatum> extends AgSeriesHighlightStyle {}

export interface AgRadialGaugeSeriesOptionsKeys {}

export interface AgRadialGaugeSeriesOptionsNames {}

export interface AgRadialGaugeSeriesScaleLabel extends AgBaseAxisLabelOptions {
    /** Array of values in axis units for specified intervals along the axis. The values in this array must be compatible with the axis type. */
    values?: number[];
    /** The axis interval. Expressed in the units of the axis. If the configured interval results in too many items given the chart size, it will be ignored. */
    step?: number;
}

export interface AgRadialGaugeSeriesScale {
    /** Maximum value of the scale. Any values exceeding this number will be clipped to this maximum. */
    min?: number;
    /** Minimum value of the scale. Any values exceeding this number will be clipped to this minimum. */
    max?: number;
    /** Configuration for the axis labels, shown next to the ticks. */
    label?: AgRadialGaugeSeriesScaleLabel;
    /** Configuration the colours. */
    fills?: AgRadialGaugeColorStop[];
}

export interface AgRadialGaugeSeriesTooltipRendererParams<TDatum>
    extends AgSeriesTooltipRendererParams<TDatum>,
        AgRadialGaugeSeriesOptionsKeys,
        AgRadialGaugeSeriesOptionsNames {
    /** Value of the Gauge */
    value: number;
}

export interface AgRadialGaugeSeriesStyle {
    /** Apply rounded corners to the gauge. */
    cornerRadius?: number;
}

export interface AgRadialGaugeSeriesBarStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Whether the bar should be shown. */
    enabled?: boolean;
}

export interface AgRadialGaugeSeriesBackgroundStyle extends FillOptions, StrokeOptions, LineDashOptions {}

export interface AgRadialGaugeSeriesNeedleStyle extends FillOptions, StrokeOptions, LineDashOptions {
    /** Whether the needle should be shown. */
    enabled?: boolean;
    /** Shape of the needle. */
    shape?: 'needle';
    /** Ratio of the size of the needle. */
    radiusRatio?: number;
    /** Spacing between radiusRatio, in pixels. */
    spacing?: number;
}

export interface AgRadialGaugeTarget extends FillOptions, StrokeOptions, LineDashOptions {
    /** Value to use to position the target */
    value: number;
    /** The shape to use for the target. You can also supply a custom marker by providing a `Marker` subclass. */
    shape?: MarkerShape;
    /** Placement of target. */
    placement?: 'inside' | 'outside' | 'middle';
    /** Spacing of the target. Ignored when placement is 'middle'. */
    spacing?: PixelSize;
    /** Size of the target. */
    size?: Ratio;
    /** Rotation of the target, in degrees. */
    rotation?: Degree;
}

export interface AgRadialGaugeTargetLabelOptions extends AgChartLabelOptions<never, never> {
    /** Spacing of the label. */
    spacing?: PixelSize;
}

export interface AgRadialGaugeTargetOptions {
    /** Label options for all targets. */
    label?: AgRadialGaugeTargetLabelOptions;
}

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
    /** Stop value of this category. */
    stop?: number;
    /** Colour of this category. */
    color: CssColor;
}

export interface AgRadialGaugeSeriesThemeableOptions<TDatum = any>
    extends AgRadialGaugeSeriesStyle,
        Omit<AgBaseSeriesThemeableOptions<TDatum>, 'highlightStyle'> {
    /** Ratio of the outer radius of the gauge. */
    outerRadiusRatio?: Ratio;
    /** Ratio of the inner radius of the gauge. */
    innerRadiusRatio?: Ratio;
    /** Angle in degrees of the start of the gauge. */
    startAngle?: Degree;
    /** Angle in degrees of the end of the gauge. */
    endAngle?: Degree;
    /** The spacing between sectors when using `segmented` appearance. */
    sectorSpacing?: number;
    /** Configuration of the appearance of the gauge. */
    appearance?: 'continuous' | 'segmented';
    /** Configuration on whether to apply `cornerRadius` only to the ends of the gauge, or each individual item within the gauge. */
    cornerMode?: 'container' | 'item';
    /** Configuration for all targets. */
    target?: AgRadialGaugeTargetOptions;
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
    margin?: PixelSize;
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
    /** Value of the Radial Gauge Series. */
    value: number;
    /** Scale of the Radial Gauge Series. */
    scale?: AgRadialGaugeSeriesScale;
    /** Configuration for the targets. */
    targets?: AgRadialGaugeTarget[];
}
