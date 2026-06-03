import type { AgChartLabelStyleOptions } from './labelOptions';
import type { AxisValue, CssColor, FontFamilyFull, Opacity, PixelSize } from './types';

export interface AgCommonCrossLineOptions<LabelType = AgBaseCrossLineLabelOptions> {
    /** Whether to show the Cross Line. */
    enabled?: boolean;
    /** The colour to use for the fill of the range. */
    fill?: CssColor;
    /** The opacity of the fill for the range. */
    fillOpacity?: Opacity;
    /** The colour of the stroke for the lines. */
    stroke?: CssColor;
    /** The width in pixels of the stroke for the lines. */
    strokeWidth?: PixelSize;
    /** The opacity of the stroke for the lines. */
    strokeOpacity?: Opacity;
    /** Defines how the line stroke is rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** Configuration for the Cross Line label. */
    label?: LabelType;
}

export interface AgLineCrossLineOptions<
    TValue = AxisValue,
    LabelType = AgBaseCrossLineLabelOptions,
> extends AgCommonCrossLineOptions<LabelType> {
    /** Renders the Cross Line as a single line positioned at `value`. */
    type: 'line';
    /** The data value at which the line should be positioned. */
    value: TValue;
}

export interface AgRangeCrossLineOptions<
    TValue = AxisValue,
    LabelType = AgBaseCrossLineLabelOptions,
> extends AgCommonCrossLineOptions<LabelType> {
    /** Renders the Cross Line as a shaded band spanning `range`. */
    type: 'range';
    /** The `[start, end]` data values bounding the shaded region. */
    range: [TValue, TValue];
}

export type AgBaseCrossLineOptions<TValue = AxisValue, LabelType = AgBaseCrossLineLabelOptions> =
    | AgLineCrossLineOptions<TValue, LabelType>
    | AgRangeCrossLineOptions<TValue, LabelType>;

export interface AgCrossLineThemeOptions<
    LabelType = AgBaseCrossLineLabelOptions,
> extends AgCommonCrossLineOptions<LabelType> {}

export interface AgBaseCrossLineLabelOptions extends Omit<AgChartLabelStyleOptions, 'fontFamily'> {
    /** The text to show in the label. */
    text?: string;
    /** The font family to use for the label. */
    fontFamily?: FontFamilyFull;
}

export type AgCrossLineLabelPosition =
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'inside'
    | 'inside-left'
    | 'inside-right'
    | 'inside-top'
    | 'inside-bottom'
    | 'inside-top-left'
    | 'inside-bottom-left'
    | 'inside-top-right'
    | 'inside-bottom-right';
