import type { AgAxisContinuousIntervalOptions, AgAxisLabelFormatterParams } from './axisOptions';
import type { Formatter } from './callbackOptions';
import type { AgChartLegendPosition } from './legendOptions';
import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, PixelSize } from './types';
export interface AgGradientLegendLabelOptions {
    /** The font style to use for the labels. */
    fontStyle?: FontStyle;
    /** The font weight to use for the labels. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: FontSize;
    /** The font family to use for the labels. */
    fontFamily?: FontFamily;
    /** The colour to use for the labels. */
    color?: CssColor;
    /** Format string used when rendering labels. */
    format?: string;
    /** Function used to render scale labels. If `value` is a number, `fractionDigits` will also be provided, which indicates the number of fractional digits used in the step between intervals; for example, a interval step of `0.0005` would have `fractionDigits` set to `4`. */
    formatter?: Formatter<AgAxisLabelFormatterParams>;
}
export interface AgGradientLegendScaleOptions {
    /** Options for the labels on the scale. */
    label?: AgGradientLegendLabelOptions;
    /** Distance between the gradient box and the labels. */
    padding?: PixelSize;
    /** Options for intervals on the scale. */
    interval?: AgAxisContinuousIntervalOptions<number>;
}
export interface AgGradientLegendOptions {
    /** Whether to show the gradient legend. By default, the chart displays a gradient legend for series using a `colorKey`. */
    enabled?: boolean;
    /** Where the legend should show in relation to the chart. */
    position?: AgChartLegendPosition;
    /** Gradient bar configuration. */
    gradient?: AgGradientLegendBarOptions;
    /** The spacing in pixels to use outside the legend. */
    spacing?: PixelSize;
    /** Reverse the display order of legend items if `true`. */
    reverseOrder?: boolean;
    /** Options for the numbers that appear below or to the side of the gradient. */
    scale?: AgGradientLegendScaleOptions;
}
export interface AgGradientLegendBarOptions {
    /** Preferred length of the gradient bar (may expand to fit labels or shrink to fit inside a chart). */
    preferredLength?: PixelSize;
    /** The thickness of the gradient bar (width for vertical or height for horizontal layout). */
    thickness?: PixelSize;
}
