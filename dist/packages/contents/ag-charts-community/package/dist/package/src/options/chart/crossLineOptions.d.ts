import type { AxisValue, CssColor, FontFamily, FontSize, FontStyle, FontWeight, Opacity, PixelSize } from './types';
export interface AgCrossLineThemeOptions extends Omit<AgBaseCrossLineOptions, 'type'> {
}
export interface AgBaseCrossLineOptions<LabelType = AgBaseCrossLineLabelOptions> {
    /** Whether to show the cross line. */
    enabled?: boolean;
    /** Type of cross line to render, defaults to `line`. */
    type?: 'line' | 'range';
    /** The data value at which the line should be positioned. This property is used if the cross-line type is `line`. */
    value?: AxisValue;
    /** The range of values from the data used to display lines at a desired chart region. This property is only used for cross-line type `range`. */
    range?: [AxisValue, AxisValue];
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
    /** Configuration for the cross-line label. */
    label?: LabelType;
}
export interface AgBaseCrossLineLabelOptions {
    /** Whether to show the cross line label. */
    enabled?: boolean;
    /** The text to show in the label. */
    text?: string;
    /** The font style to use for the label. */
    fontStyle?: FontStyle;
    /** The font weight to use for the label. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the label. */
    fontSize?: FontSize;
    /** The font family to use for the label. */
    fontFamily?: FontFamily;
    /** Padding in pixels between the label and the edge of the cross-line. */
    padding?: PixelSize;
    /** The colour to use for the label. */
    color?: CssColor;
}
export type AgCrossLineLabelPosition = 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'inside' | 'insideLeft' | 'insideRight' | 'insideTop' | 'insideBottom' | 'insideTopLeft' | 'insideBottomLeft' | 'insideTopRight' | 'insideBottomRight';
