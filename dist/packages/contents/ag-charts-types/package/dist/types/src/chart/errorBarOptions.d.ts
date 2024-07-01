import type { LineDashOptions, StrokeOptions } from '../series/cartesian/commonOptions';
import type { DatumCallbackParams, Styler } from './callbackOptions';
import type { PixelSize, Ratio } from './types';
export type AgErrorBarItemStylerParams<TDatum> = DatumCallbackParams<TDatum> & SeriesKeyOptions & ErrorBarKeyOptions & Required<AgErrorBarThemeableOptions>;
interface ErrorBarStylingOptions extends StrokeOptions, LineDashOptions {
    /** Whether to display the error bars. */
    visible?: boolean;
}
interface SeriesKeyOptions {
    /** The key to use to retrieve x-values from the data. */
    xKey: string;
    /** The key to use to retrieve y-values from the data. */
    yKey?: string;
}
interface ErrorBarKeyOptions {
    /** The key to use to retrieve lower bound error values from the x-axis data. */
    xLowerKey?: string;
    /** The key to use to retrieve upper bound error values from the x-axis data. */
    xUpperKey?: string;
    /** The key to use to retrieve lower bound error values from the y-axis data. */
    yLowerKey?: string;
    /** The key to use to retrieve upper bound error values from the y-axis data. */
    yUpperKey?: string;
}
interface ErrorBarNameOptions {
    /** Human-readable description of the lower bound error value for the x-axis. This is the value to use in tooltips or labels. */
    xLowerName?: string;
    /** Human-readable description of the upper bound error value for the x-axis. This is the value to use in tooltips or labels. */
    xUpperName?: string;
    /** Human-readable description of the lower bound error value for the y-axis. This is the value to use in tooltips or labels. */
    yLowerName?: string;
    /** Human-readable description of the upper bound error value for the y-axis. This is the value to use in tooltips or labels. */
    yUpperName?: string;
}
interface ErrorBarFormatterOption<TDatum> {
    /** Function used to return formatting for individual error bars, based on the given parameters. If the current error bar is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    itemStyler?: Styler<AgErrorBarItemStylerParams<TDatum>, AgErrorBarThemeableOptions>;
}
export interface ErrorBarCapOptions extends ErrorBarStylingOptions {
    /** Absolute length of caps in pixels. */
    length?: PixelSize;
    /** Length of caps relative to the shape used by the series. */
    lengthRatio?: Ratio;
}
export interface AgErrorBarThemeableOptions extends ErrorBarStylingOptions {
    /** Options to style error bars' caps */
    cap?: ErrorBarCapOptions;
}
export declare const AgErrorBarSupportedSeriesTypes: readonly ["bar", "line", "scatter"];
export interface AgErrorBarOptions<TDatum> extends ErrorBarKeyOptions, ErrorBarNameOptions, ErrorBarFormatterOption<TDatum>, AgErrorBarThemeableOptions {
}
export {};
