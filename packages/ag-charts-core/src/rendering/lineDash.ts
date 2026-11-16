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

/** The `lineDash` options once the theme has resolved any dash name to its array of lengths. */
export interface ResolvedLineDashOptions {
    lineDash?: PixelSize[];
    lineDashOffset?: PixelSize;
}
