import type { AgLineDashName, PixelSize } from 'ag-charts-types';

/**
 * The dash and gap lengths that each stock dash name stands for, in multiples of the stroke width, so that a dot is
 * always as long as the line is wide.
 */
export const LINE_DASH_PATTERNS: Readonly<Record<AgLineDashName, readonly number[]>> = {
    solid: [0],
    dot: [1, 1.5],
    dash: [3, 2],
    'dash-dot': [3, 1.5, 1, 1.5],
    'long-dash': [7, 2],
    'long-dash-dot': [7, 1.5, 1, 1.5],
    'long-dash-dot-dot': [7, 2, 1, 2, 1, 2],
    'dash-dot-dot': [3, 1.5, 1, 1.5, 1, 1.5],
    'dash-long-dash': [3, 2, 7, 2],
    'long-dash-dash-dash': [7, 1.5, 3, 1.5, 3, 1.5],
};

export function isLineDashName(value: unknown): value is AgLineDashName {
    return typeof value === 'string' && Object.hasOwn(LINE_DASH_PATTERNS, value);
}

/** A stroke width that a stock dash scales by: any width that is not a positive number counts as 1. */
export function lineDashScaleWidth(strokeWidth: unknown) {
    return typeof strokeWidth === 'number' && Number.isFinite(strokeWidth) && strokeWidth > 0 ? strokeWidth : 1;
}

/** The stock dash's lengths, which are in multiples of the stroke width, in pixels. */
export function scaleLineDashName(name: AgLineDashName, strokeWidth: unknown) {
    const width = lineDashScaleWidth(strokeWidth);
    return LINE_DASH_PATTERNS[name].map((length) => length * width);
}

/**
 * The dash to draw a line at `drawnWidth` when it was resolved for one of `strokeWidth`, such as a legend line that is
 * thinner than its series: the lengths scale in proportion, so that a dot stays a dot.
 */
export function rescaleLineDash(
    lineDash: readonly number[] | undefined,
    strokeWidth: number | undefined,
    drawnWidth: number
) {
    if (lineDash == null || !Number.isFinite(drawnWidth) || drawnWidth <= 0) return lineDash;

    const resolvedWidth = lineDashScaleWidth(strokeWidth);
    if (resolvedWidth === drawnWidth) return lineDash;

    return lineDash.map((length) => (length / resolvedWidth) * drawnWidth);
}

/** The `lineDash` options once the theme has resolved any dash name to its array of lengths. */
export interface ResolvedLineDashOptions {
    lineDash?: PixelSize[];
    lineDashOffset?: PixelSize;
}
