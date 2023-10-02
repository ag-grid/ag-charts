import type { AgChartCallbackParams } from './callbackOptions';
import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight } from './types';

/**
 * Represents the configuration options for labels in an AgChart.
 *
 * Labels are used to display textual information alongside data points in a chart.
 *
 * @typeparam TDatum - The type of data associated with the chart.
 * @typeparam TParams - The type of parameters expected by the label formatter function.
 */
export interface AgChartLabelOptions<TDatum = any, TParams = {}> {
    /**  Determines whether the labels should be displayed on the chart. */
    enabled?: boolean;
    /** The color to apply to the labels. */
    color?: CssColor;
    /** The font style to apply to the labels (e.g., 'normal', 'italic', 'oblique'). */
    fontStyle?: FontStyle;
    /** The font weight to apply to the labels (e.g., 'normal', 'bold', 'lighter', 'bolder'). */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: FontSize;
    /**  The font family to use for the labels.  */
    fontFamily?: FontFamily;
    /** A custom formatting function used to convert data values into text for display by labels. */
    formatter?: (params: AgChartLabelFormatterParams<TDatum> & TParams) => string;
}

export interface AgChartLabelFormatterParams<TDatum> extends AgChartCallbackParams<TDatum> {
    /** The default label value that would have been used without a formatter. */
    defaultValue: any;
}
