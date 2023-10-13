import type { StrokeOptions } from '../series/cartesian/commonOptions';
import type { PixelSize, Ratio } from './types';

interface ErrorBarStylingOptions extends StrokeOptions {
    /** Whether to display the error bars. */
    visible?: boolean;
}

interface ErrorBarCapLengthOptions {
    /** Absolute length of caps in pixels. */
    length?: PixelSize;
    /** Length of caps relative to the shape used by the series. */
    lengthRatio?: Ratio;
}

export interface AgErrorBarDataOptions {
    /** The key to use to retrieve lower bound error values from the x axis data. */
    xLowerKey?: string;
    /** Human-readable description of the lower bound error value for the x axis. This is the value to use in tooltips or labels. */
    xLowerName?: string;
    /** The key to use to retrieve upper bound error values from the x axis data. */
    xUpperKey?: string;
    /** Human-readable description of the upper bound error value for the x axis. This is the value to use in tooltips or labels. */
    xUpperName?: string;

    /** The key to use to retrieve lower bound error values from the y axis data. */
    yLowerKey?: string;
    /** Human-readable description of the lower bound error value for the y axis. This is the value to use in tooltips or labels. */
    yLowerName?: string;
    /** The key to use to retrieve upper bound error values from the y axis data. */
    yUpperKey?: string;
    /** Human-readable description of the upper bound error value for the y axis. This is the value to use in tooltips or labels. */
    yUpperName?: string;
}

export interface AgErrorBarCapOptions extends ErrorBarCapLengthOptions, ErrorBarStylingOptions {}

export interface AgErrorBarOptions extends AgErrorBarDataOptions, ErrorBarStylingOptions {
    /** Options to style error bars' caps */
    cap?: AgErrorBarCapOptions;
}

export const AgErrorBarSupportedSeriesTypes = ['bar', 'line', 'scatter'] as const;

export interface AgErrorBarSeriesOptions {
    type?: (typeof AgErrorBarSupportedSeriesTypes)[number];
    /** Configuration for the Error Bars. */
    errorBar?: AgErrorBarOptions;
}
