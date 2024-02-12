import type { AgAxisLabelFormatterParams } from './axisOptions';
import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, Opacity, PixelSize, Ratio } from './types';

export interface AgNavigatorMiniChartLabelOptions {
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

export interface AgNavigatorMiniChartPadding {
    /** Padding between the top edge and the series. */
    top?: number;
    /** Padding between the bottom edge and the series. */
    bottom?: number;
}

export interface AgNavigatorMiniChartOptions {
    /** Whether to show a Mini Chart in the navigator. */
    enabled?: boolean;
    /** Configuration for the Mini Chart's axis labels. */
    label?: AgNavigatorMiniChartLabelOptions;
    /** Configuration for the padding in the Mini Chart. */
    padding?: AgNavigatorMiniChartPadding;
}

export interface AgNavigatorMaskOptions {
    /** The fill colour used by the mask. */
    fill?: CssColor;
    /** The stroke colour used by the mask. */
    stroke?: CssColor;
    /** The stroke width used by the mask. */
    strokeWidth?: PixelSize;
    /** The opacity of the mask's fill in the `[0, 1]` interval, where `0` is effectively no masking. */
    fillOpacity?: Opacity;
}

export interface AgNavigatorHandleOptions {
    /** The fill colour used by the handle. */
    fill?: CssColor;
    /** The stroke colour used by the handle. */
    stroke?: CssColor;
    /** The stroke width used by the handle. */
    strokeWidth?: PixelSize;
    /** The width of the handle. */
    width?: PixelSize;
    /** The height of the handle. */
    height?: PixelSize;
    /** The distance between the handle's grip lines. */
    gripLineGap?: PixelSize;
    /** The length of the handle's grip lines. */
    gripLineLength?: PixelSize;
}

export interface AgNavigatorOptions {
    /** Whether to show the navigator. */
    enabled?: boolean;
    /** The height of the navigator. */
    height?: PixelSize;
    /** The distance between the navigator and the bottom axis. */
    margin?: PixelSize;
    /** The start of the visible range in the `[0, 1]` interval. */
    min?: Ratio;
    /** The end of the visible range in the `[0, 1]` interval. */
    max?: Ratio;
    /** Configuration for the navigator's visible range mask. */
    mask?: AgNavigatorMaskOptions;
    /** Configuration for the navigator's left handle. */
    minHandle?: AgNavigatorHandleOptions;
    /** Configuration for the navigator's right handle. */
    maxHandle?: AgNavigatorHandleOptions;
    /** MiniChart options. */
    miniChart?: AgNavigatorMiniChartOptions;
}
