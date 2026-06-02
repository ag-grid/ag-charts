import { type ColorScaleColorStop, type ColorScaleMode, computeColorBins } from 'ag-charts-core';

import type { ColorScale } from './colorScale';

export function configureColorScale(
    colorScale: ColorScale,
    colorScaleProps: {
        fills: ColorScaleColorStop[];
        domain?: [number, number];
        mode: ColorScaleMode;
    },
    dataDomain: (number | bigint)[]
): void {
    if (dataDomain.length < 2) return;
    if (colorScaleProps.fills.length === 0) return;

    // The colour data domain can be bigint (AG-16608 heatmap); computeColorBins narrows it for the
    // interpolation maths, so the bigint stays type-visible up to that single boundary.
    const domainTuple: [number | bigint, number | bigint] = [dataDomain[0], dataDomain.at(-1)!];
    const displayDomain: [number | bigint, number | bigint] = colorScaleProps.domain ?? domainTuple;

    const { domain, range } = computeColorBins(colorScaleProps.fills, displayDomain, colorScaleProps.mode);
    colorScale.mode = colorScaleProps.mode;
    colorScale.domain = domain;
    colorScale.range = range;
    colorScale.displayDomain = displayDomain;
    colorScale.update();
}
