import type { LabelBoxOptions, TextOrSegments } from '../series/cartesian/commonOptions';
import type { RichFormatter, Styler } from './callbackOptions';
import type { AgNumericValue, AgTimeValue } from './dataValues';
import type { AgCssColorOrRef } from './themeParamsOptions';
import type {
    ContextDefault,
    CssColor,
    Degree,
    FontFamilyFull,
    FontSize,
    FontStyle,
    FontWeight,
    PixelSize,
    Ratio,
    TextAlign,
    TextWrap,
} from './types';

export type AgAxisValue = number | bigint | string | Date;

export type AgAxisDomain = number[] | bigint[] | string[] | Date[];

export type AgAxisDirection = 'x' | 'y' | 'angle' | 'radius';

export interface AgAxisBoundSeries {
    /** ID of the series for values on the related axis. */
    seriesId: string;
    /** Key used by the series for values on the related axis. */
    key: string;
    /** Optional name used by the series for values on the related axis. */
    name?: string;
}

export interface AgAxisCoordinate {
    /** The scale value of the axis at this point. */
    value: AgAxisValue;
    /** Direction of the axis the title belongs to. */
    direction: AgAxisDirection;
    /** The index of the resolved value */
    index: number;
    /** Metadata about series bound to the axis the title belongs to. */
    boundSeries: AgAxisBoundSeries[];
    /** Computed domain of the axis */
    domain: AgAxisDomain;
}

export interface AgAxisCaptionFormatterParams {
    /** Default value to be used for the axis title (as specified in chart options or theme). */
    defaultValue?: string;
    /** Direction of the axis the title belongs to. */
    direction: AgAxisDirection;
    /** Metadata about series bound to the axis the title belongs to. */
    boundSeries: AgAxisBoundSeries[];
    /** Computed domain of the axis */
    domain: any[];
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
    /** The font family to use for the title. A single family name, or an array of names used as fallbacks. */
    fontFamily?: FontFamilyFull;
    /** The colour to use for the title. A colour string, or a theme-colour reference object. */
    color?: AgCssColorOrRef;
    /** Spacing between the axis labels and the axis title. */
    spacing?: PixelSize;
    /** Used to constrain the size of the title along the text direction before wrapping or truncation. */
    maxWidth?: PixelSize;
    /** Used to constrain the size of the title across the text direction before wrapping or truncation. */
    maxHeight?: PixelSize;
    /**
     * Text wrapping strategy for long text.
     * - `'always'` will always wrap text to fit within the `maxWidth`.
     * - `'hyphenate'` is similar to `'always'`, but inserts a hyphen (`-`) if forced to wrap in the middle of a word.
     * - `'on-space'` will only wrap on white space. If there is no possibility to wrap a line on space and satisfy the `maxWidth`, the text will be truncated.
     * - `'never'` disables text wrapping.
     *
     * Default: `'always'`
     */
    wrapping?: TextWrap;
    /** Whether the title text should be automatically truncated to fit the available axis length.
     *
     * Default: `true`
     */
    truncate?: boolean;
    /** Formatter to allow dynamic axis title calculation. */
    formatter?: RichFormatter<AgAxisCaptionFormatterParams>;
}

/**
 * Orientation of an axis title.
 * - `'horizontal'` renders the title in the normal left-to-right reading direction.
 * - `'vertical'` and `'vertical-reversed'` rotate it a quarter-turn in opposite directions.
 */
export type AgAxisTitleOrientation = 'horizontal' | 'vertical' | 'vertical-reversed';

export interface AgCartesianAxisCaptionOptions extends AgAxisCaptionOptions {
    /**
     * Orientation of the title.
     *
     * Default: aligned with the axis line (`'horizontal'` on the x-axis, `'vertical'` on the y-axis).
     */
    orientation?: AgAxisTitleOrientation;
}

export interface AgBaseAxisOptions<LabelType = any, TContext = ContextDefault> {
    /** Axis type identifier. */
    type?: string;
    /** Context object to use in callbacks. */
    context?: TContext;
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

export interface AgBaseContinuousAxisOptions<TDatum extends AgTimeValue = number> {
    /** The min value for the axis domain. */
    min?: TDatum;
    /** The max value for the axis domain. */
    max?: TDatum;
    /** The min value for the axis, unless extended by the series data or `nice` option. */
    preferredMin?: TDatum;
    /** The max value for the axis, unless extended by the series data or `nice` option. */
    preferredMax?: TDatum;
}

export interface AgContinuousAxisOptions<
    TDatum extends AgTimeValue = number,
    TInterval extends AgTimeInterval | AgTimeIntervalUnit | AgNumericValue = number,
> extends AgBaseContinuousAxisOptions<TDatum> {
    /** If `true`, the range will be rounded up to ensure nice equal spacing between the ticks.
     *
     * __Note:__ This does not override the `min` or `max` options.
     */
    nice?: boolean;
    /** Configuration for the axis ticks interval. A unit keyword (or number), or an object describing the interval. */
    interval?: AgAxisContinuousIntervalOptions<TInterval>;
}

export interface AgAxisContinuousIntervalOptions<
    T extends AgTimeInterval | AgTimeIntervalUnit | AgNumericValue,
> extends AgAxisBaseIntervalOptions {
    /** The axis interval. Expressed in the units of the axis. If the configured interval results in too many items given the chart size, it will be ignored. `bigint` steps are accepted but precision is limited to the Number range. */
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

export interface AgBaseAxisLabelStyleOptions extends LabelBoxOptions {
    /** The font style to use for the labels. */
    fontStyle?: FontStyle;
    /** The font weight to use for the labels. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: FontSize;
    /** The font family to use for the labels. A single family name, or an array of names used as fallbacks. */
    fontFamily?: FontFamilyFull;
    /** Spacing in pixels between the axis label and the tick. */
    spacing?: PixelSize;
    /** The colour to use for the labels. A colour string, or a theme-colour reference object. */
    color?: AgCssColorOrRef;
}

export interface AgAxisLabelFormatterParams<TContext = ContextDefault> {
    readonly type: 'number' | 'date' | 'category';
    readonly value: any;
    readonly index: number;
    /** The depth of the label on a `grouped-category` axis, counted outwards from the leaf labels, which are depth `0`. Undefined on every other axis type. */
    readonly depth?: number;
    readonly fractionDigits?: number;
    readonly unit?: AgTimeIntervalUnit;
    readonly step?: number;
    readonly boundSeries: AgAxisBoundSeries[];
    readonly domain: any[];
    /** Context for this callback. */
    readonly context?: TContext;
    /** The currently visible domain. [min, max] */
    readonly visibleDomain?: [AgNumericValue, AgNumericValue];
}

export interface AgAxisLabelStylerParams<TContext = ContextDefault> extends AgBaseAxisLabelStyleOptions {
    /** The label value that would be used, before applying formating. */
    readonly value: any;
    /** The label value that would be used, after applying formatting. Plain text, or an array of segments for rich content. */
    readonly formattedValue?: TextOrSegments;
    /** Context for this callback. */
    readonly context?: TContext;
}

export interface AgBaseAxisLabelOptions<TContext = ContextDefault> extends AgBaseAxisLabelStyleOptions {
    /** Set to `false` to hide the axis labels. */
    enabled?: boolean;
    /** The rotation of the axis labels in degrees. Note: for integrated charts the default is 335 degrees, unless the axis shows grouped or default categories (indexes). The first row of labels in a grouped category axis is rotated perpendicular to the axis line. */
    rotation?: Degree;
    /**
     * The horizontal alignment of the axis labels. If unset, the alignment is derived from the axis position and the label rotation.
     *
     * On a vertical axis with unrotated labels this aligns each label within the axis's label column; on a horizontal axis, or whenever the labels are rotated, it aligns each label around its own anchor point.
     *
     * On a horizontal axis with a banded scale (`category`, `ordinal-time`) the labels align to the edges of the band each tick belongs to, rather than to the middle of the band where the tick sits.
     *
     * Honoured on cartesian axes (`number`, `category`, `time`, `log`, `ordinal-time`). Ignored on grouped-category, angle and radius axes, and on funnel / cone-funnel `stageLabel`.
     *
     * Default: `undefined`
     */
    textAlign?: TextAlign;
    /** Avoid axis label collision by automatically reducing the number of ticks displayed. If set to `false`, axis labels may collide. */
    avoidCollisions?: boolean;
    /** Minimum gap in pixels between the axis labels before being removed to avoid collisions. */
    minSpacing?: PixelSize;
    /** Function used to render axis labels. If `value` is a number, `fractionDigits` will also be provided, which indicates the number of fractional digits used in the step between ticks; for example, a tick step of `0.0005` would have `fractionDigits` set to `4` */
    formatter?: RichFormatter<AgAxisLabelFormatterParams<TContext>>;
    /** Function used to style axis labels. */
    itemStyler?: Styler<AgAxisLabelStylerParams<TContext>, AgBaseAxisLabelStyleOptions>;
}

export interface AgNumericAxisFormattableLabelOptions<
    TContext = ContextDefault,
> extends AgBaseAxisLabelOptions<TContext> {
    /** Format string used when rendering labels. */
    format?: string;
}

export interface AgTimeAxisFormattableLabelUnitFormat {
    millisecond?: string;
    second?: string;
    hour?: string;
    day?: string;
    month?: string;
    year?: string;
}

export type AgTimeAxisFormattableLabelFormat = string | AgTimeAxisFormattableLabelUnitFormat;

export interface AgTimeAxisFormattableLabelOptions<TContext = ContextDefault> extends AgBaseAxisLabelOptions<TContext> {
    /** Format string used when rendering labels. A format string, or an object specifying a format per time unit. */
    format?: AgTimeAxisFormattableLabelFormat;
}

export interface AgAxisGridStyle {
    /** The colour of the fill between grid lines. */
    fill?: CssColor;
    /** The opacity of the fill between grid lines. */
    fillOpacity?: Ratio;
    /** The colour of the grid line. */
    stroke?: CssColor;
    /** The width of the grid line in pixels. */
    strokeWidth?: PixelSize;
    /** Defines how the grid lines are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
}

export type AgTimeIntervalUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

export interface AgTimeInterval {
    /** The base duration of the time interval. */
    unit: AgTimeIntervalUnit;
    /** A multiplier of the `unit`.
     *
     * For example, a unit of `'week'` and a step of `2` would be every two weeks. */
    step?: number;
    /** Defines the alignment of time interval.
     *
     * For example, a unit of `'week'` with an epoch date of a Monday would be every Monday.
     * */
    epoch?: Date;
    /** Whether all dates should be in UTC, or local time. */
    utc?: boolean;
}
