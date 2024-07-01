import type { Formatter } from './callbackOptions';
import type { CssColor, Degree, FontFamily, FontSize, FontStyle, FontWeight, PixelSize } from './types';
export interface AgAxisBoundSeries {
    /** Key used by the series for values on the related axis. */
    key: string;
    /** Optional name used by the series for values on the related axis. */
    name?: string;
}
export interface AgAxisCaptionFormatterParams {
    /** Default value to be used for the axis title (as specified in chart options or theme). */
    defaultValue?: string;
    /** Direction of the axis the title belongs to. */
    direction: 'x' | 'y';
    /** Metadata about series bound to the axis the title belongs to. */
    boundSeries: AgAxisBoundSeries[];
}
export interface AgAxisCaptionOptions {
    /** Whether the title should be shown. */
    enabled?: boolean;
    /** The text to show in the title. */
    text?: string;
    /** The font style to use for the title. */
    fontStyle?: FontStyle;
    /** The font weight to use for the title. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the title. */
    fontSize?: FontSize;
    /** The font family to use for the title. */
    fontFamily?: FontFamily;
    /** The colour to use for the title. */
    color?: CssColor;
    /** Spacing between the axis labels and the axis title. */
    spacing?: PixelSize;
    /** Formatter to allow dynamic axis title calculation. */
    formatter?: Formatter<AgAxisCaptionFormatterParams>;
}
export interface AgBaseAxisOptions<LabelType = AgBaseAxisLabelOptions> {
    /** Axis type identifier. */
    type: string;
    /** An array of keys determining which series are charted on this axis. */
    keys?: string[];
    /** Reverse the axis scale domain if `true`. */
    reverse?: boolean;
    /** Configuration for the axis line. */
    line?: AgAxisLineOptions;
    /** Configuration for the axis grid lines. */
    gridLine?: AgAxisGridLineOptions;
    /** Configuration for the axis labels, shown next to the ticks. */
    label?: LabelType;
    /** Configuration for the axis ticks. */
    tick?: AgAxisBaseTickOptions;
    /** Configuration for the axis ticks interval. */
    interval?: AgAxisBaseIntervalOptions;
}
export interface AgContinuousAxisOptions<TDatum extends Date | number = number, TInterval extends TimeInterval | number = number> {
    /** If `true`, the range will be rounded up to ensure nice equal spacing between the ticks. */
    nice?: boolean;
    /** User override for the automatically determined min value (based on series data). */
    min?: TDatum;
    /** User override for the automatically determined max value (based on series data). */
    max?: TDatum;
    /** Configuration for the axis ticks interval. */
    interval?: AgAxisContinuousIntervalOptions<TInterval>;
}
export interface AgAxisContinuousIntervalOptions<T extends TimeInterval | number> extends AgAxisBaseIntervalOptions {
    /** The axis interval. Expressed in the units of the axis. If the configured interval results in too many items given the chart size, it will be ignored. */
    step?: T;
    /** Maximum gap in pixels between items. */
    maxSpacing?: PixelSize;
}
export interface AgAxisLineOptions {
    /** Set to `false` to hide the axis line. */
    enabled?: boolean;
    /** The width in pixels of the axis line. */
    width?: PixelSize;
    /** The colour of the axis line. */
    stroke?: CssColor;
}
export interface AgAxisGridLineOptions {
    /** Set to `false` to hide the axis grid lines. */
    enabled?: boolean;
    /** The width in pixels of the axis grid lines. */
    width?: PixelSize;
    /** Configuration of the lines used to form the grid in the chart series area. */
    style?: AgAxisGridStyle[];
}
export interface AgAxisBaseTickOptions {
    /** Set to `false` to hide the axis ticks. */
    enabled?: boolean;
    /** The width in pixels of the axis ticks. */
    width?: PixelSize;
    /** The length in pixels of the axis ticks. */
    size?: PixelSize;
    /** The colour of the axis ticks. */
    stroke?: CssColor;
}
export interface AgAxisBaseIntervalOptions {
    /** Array of values in axis units for specified intervals along the axis. The values in this array must be compatible with the axis type. */
    values?: any[];
    /** Minimum gap in pixels between intervals. */
    minSpacing?: PixelSize;
}
export interface AgAxisLabelFormatterParams {
    readonly value: any;
    readonly index: number;
    readonly fractionDigits?: number;
}
export interface AgBaseAxisLabelOptions {
    /** Set to `false` to hide the axis labels. */
    enabled?: boolean;
    /** The font style to use for the labels. */
    fontStyle?: FontStyle;
    /** The font weight to use for the labels. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: FontSize;
    /** The font family to use for the labels */
    fontFamily?: FontFamily;
    /** Padding in pixels between the axis label and the tick. */
    padding?: PixelSize;
    /** The colour to use for the labels */
    color?: CssColor;
    /** The rotation of the axis labels in degrees. Note: for integrated charts the default is 335 degrees, unless the axis shows grouped or default categories (indexes). The first row of labels in a grouped category axis is rotated perpendicular to the axis line. */
    rotation?: Degree;
    /** Avoid axis label collision by automatically reducing the number of ticks displayed. If set to `false`, axis labels may collide. */
    avoidCollisions?: boolean;
    /** Minimum gap in pixels between the axis labels before being removed to avoid collisions. */
    minSpacing?: PixelSize;
    /** Format string used when rendering labels. */
    format?: string;
    /** Function used to render axis labels. If `value` is a number, `fractionDigits` will also be provided, which indicates the number of fractional digits used in the step between ticks; for example, a tick step of `0.0005` would have `fractionDigits` set to `4` */
    formatter?: Formatter<AgAxisLabelFormatterParams>;
}
export interface AgAxisGridStyle {
    /** The colour of the grid line. */
    stroke?: CssColor;
    /** Defines how the grid lines are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
}
export interface TimeInterval {
    /**
     * Returns a new date representing the latest interval boundary date before or equal to date.
     * For example, `day.floor(date)` typically returns 12:00 AM local time on the given date.
     * @param date
     */
    floor(date: Date | number): Date;
    /**
     * Returns a new date representing the earliest interval boundary date after or equal to date.
     * @param date
     */
    ceil(date: Date | number): Date;
    /**
     * Returns an array of dates representing every interval boundary after or equal to start (inclusive) and before stop (exclusive).
     * @param start Range start.
     * @param stop Range end.
     * @param extend If specified, the requested range will be extended to the closest "nice" values.
     */
    range(start: Date, stop: Date, extend?: boolean): Date[];
}
