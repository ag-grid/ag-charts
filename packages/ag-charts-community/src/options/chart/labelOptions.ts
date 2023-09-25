import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight } from './types';

export interface AgChartLabelOptions {
    /** Whether or not the labels should be shown. */
    enabled?: boolean;
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
}
