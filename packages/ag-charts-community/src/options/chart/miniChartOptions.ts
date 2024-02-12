import type { AgAxisLabelFormatterParams } from './axisOptions';
import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, PixelSize } from './types';

export interface AgMiniChartLabelOptions {
    /** Set to `false` to hide the axis labels. */
    enabled?: boolean;
    /** The font style to use for the labels. */
    fontStyle?: FontStyle;
    /** The font weight to use for the labels. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: FontSize;
    /** The font family to use for the labels. */
    fontFamily?: FontFamily;
    /** Padding in pixels between the axis label and the tick. */
    padding?: PixelSize;
    /** The colour to use for the labels. */
    color?: CssColor;
    /** Avoid axis label collision by automatically reducing the number of ticks displayed. If set to `false`, axis labels may collide. */
    avoidCollisions?: boolean;
    /** Minimum gap in pixels between the axis labels before being removed to avoid collisions. */
    minSpacing?: PixelSize;
    /** Format string used when rendering labels. */
    format?: string;
    /** Function used to render axis labels. If `value` is a number, `fractionDigits` will also be provided, which indicates the number of fractional digits used in the step between ticks; for example, a tick step of `0.0005` would have `fractionDigits` set to `4`. */
    formatter?: (params: AgAxisLabelFormatterParams) => string | undefined;
}

export interface AgMiniChartPadding {
    /** Padding between the top edge and the series. */
    top?: number;
    /** Padding between the bottom edge and the series. */
    bottom?: number;
}

export interface AgMiniChartOptions {
    /** Whether to show a Mini Chart in the navigator. */
    enabled?: boolean;
    /** Configuration for the Mini Chart's axis labels. */
    label?: AgMiniChartLabelOptions;
    /** Configuration for the padding in the Mini Chart. */
    padding?: AgMiniChartPadding;
}
