import { type ColorScaleColorStop, type ColorScaleMode, computeColorBins } from 'ag-charts-core';

import type { ColorScale } from './colorScale';

/**
 * Configures a ColorScale from either explicit fills (via computeColorBins)
 * or a fallback continuous range. Extracts the pattern shared by all
 * colour-scale-aware series.
 */
export function configureColorScale(
    colorScale: ColorScale,
    colorScaleProps: {
        fills: ColorScaleColorStop[];
        domain?: [number, number];
        mode: ColorScaleMode;
    },
    dataDomain: number[],
    fallbackRange: string[]
): void {
    if (dataDomain.length < 2) return;
    if (colorScaleProps.fills.length === 0 && fallbackRange.length === 0) return;

    const domainTuple: [number, number] = [dataDomain[0], dataDomain.at(-1)!];

    if (colorScaleProps.fills.length > 0) {
        const effectiveDomain: [number, number] = colorScaleProps.domain ?? domainTuple;
        const { domain, range } = computeColorBins(colorScaleProps.fills, effectiveDomain, colorScaleProps.mode);
        colorScale.mode = colorScaleProps.mode;
        colorScale.domain = domain;
        colorScale.range = range;
    } else {
        colorScale.mode = 'continuous';
        colorScale.domain = domainTuple;
        colorScale.range = fallbackRange;
    }
    colorScale.update();
}
