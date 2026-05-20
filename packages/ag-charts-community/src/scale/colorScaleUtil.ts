import { type ColorScaleColorStop, type ColorScaleMode, computeColorBins } from 'ag-charts-core';

import type { ColorScale } from './colorScale';

export function configureColorScale(
    colorScale: ColorScale,
    colorScaleProps: {
        fills: ColorScaleColorStop[];
        domain?: [number, number];
        mode: ColorScaleMode;
    },
    dataDomain: number[]
): void {
    if (dataDomain.length < 2) return;
    if (colorScaleProps.fills.length === 0) return;

    const domainTuple: [number, number] = [dataDomain[0], dataDomain.at(-1)!];
    const displayDomain: [number, number] = colorScaleProps.domain ?? domainTuple;

    const { domain, range } = computeColorBins(colorScaleProps.fills, displayDomain, colorScaleProps.mode);
    colorScale.mode = colorScaleProps.mode;
    colorScale.domain = domain;
    colorScale.range = range;
    colorScale.displayDomain = displayDomain;
    colorScale.update();
}
