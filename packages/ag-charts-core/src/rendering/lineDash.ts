import type { AgLineDashName, PixelSize } from 'ag-charts-types';

/** The dash and gap lengths, in pixels, that each stock dash name stands for. */
export const LINE_DASH_PATTERNS: Readonly<Record<AgLineDashName, readonly PixelSize[]>> = {
    solid: [0],
    dot: [2, 3],
    dash: [6, 4],
    'dash-dot': [6, 3, 2, 3],
    'long-dash': [14, 4],
    'long-dash-dot': [14, 3, 2, 3],
    'long-dash-dot-dot': [14, 4, 2, 4, 2, 4],
    'dash-dot-dot': [6, 3, 2, 3, 2, 3],
    'dash-long-dash': [6, 4, 14, 4],
    'long-dash-dash-dash': [14, 3, 6, 3, 6, 3],
};

/** A `lineDash` as a user can configure it: a stock dash name or an array of lengths. */
export type LineDashValue = PixelSize[] | AgLineDashName;

/**
 * Resolves a configured `lineDash` to its array of lengths. Arrays pass through by reference, and each name always
 * yields the same array, so identity-based change detection keeps working.
 */
export function resolveLineDash(lineDash: readonly PixelSize[] | AgLineDashName): readonly PixelSize[];
export function resolveLineDash(
    lineDash: readonly PixelSize[] | AgLineDashName | undefined
): readonly PixelSize[] | undefined;
export function resolveLineDash(
    lineDash: readonly PixelSize[] | AgLineDashName | undefined
): readonly PixelSize[] | undefined {
    return typeof lineDash === 'string' ? LINE_DASH_PATTERNS[lineDash] : lineDash;
}
