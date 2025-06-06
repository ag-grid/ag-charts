import type { LineDashOptions, StrokeOptions } from '../series/cartesian/commonOptions';
import type { DatumCallbackParams, Styler } from './callbackOptions';
import type { PixelSize, Ratio, TDatumDefault } from './types';

export type AgErrorBarItemStylerParams<TDatum = TDatumDefault> = DatumCallbackParams<TDatum> &
    SeriesKeyOptions<TDatum> &
    ErrorBarKeyOptions<TDatum> &
    Required<AgErrorBarThemeableOptions>;

interface ErrorBarStylingOptions extends StrokeOptions, LineDashOptions {
    /** Whether to display the error bars. */
    visible?: boolean;
}

interface SeriesKeyOptions<TDatum> {
    /** The key to use to retrieve x-values from the data. */
    xKey: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve y-values from the data. */
    yKey?: TDatum extends object ? keyof TDatum & string : string;
}

interface ErrorBarKeyOptions<TDatum> {
    /** The key to use to retrieve lower bound error values from the x-axis data. */
    xLowerKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve upper bound error values from the x-axis data. */
    xUpperKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve lower bound error values from the y-axis data. */
    yLowerKey?: TDatum extends object ? keyof TDatum & string : string;
    /** The key to use to retrieve upper bound error values from the y-axis data. */
    yUpperKey?: TDatum extends object ? keyof TDatum & string : string;
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

export const AgErrorBarSupportedSeriesTypes = ['bar', 'line', 'scatter'] as const;

export interface AgErrorBarOptions<TDatum>
    extends ErrorBarKeyOptions<TDatum>,
        ErrorBarNameOptions,
        ErrorBarFormatterOption<TDatum>,
        AgErrorBarThemeableOptions {}
