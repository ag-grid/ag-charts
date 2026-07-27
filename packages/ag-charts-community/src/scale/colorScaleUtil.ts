import { type ColorScaleColorStop, type ColorScaleMode, type Logger, computeColorBins } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import type { ColorScale } from './colorScale';

export function configureColorScale(
    colorScale: ColorScale,
    colorScaleProps: {
        fills: ColorScaleColorStop[];
        domain?: [number, number];
        mode: ColorScaleMode;
    },
    dataDomain: AgNumericValue[],
    logger?: Logger
): void {
    if (logger != null) colorScale.logger = logger;

    if (dataDomain.length < 2) return;
    if (colorScaleProps.fills.length === 0) return;

    const domainTuple: [AgNumericValue, AgNumericValue] = [dataDomain[0], dataDomain.at(-1)!];
    const displayDomain: [AgNumericValue, AgNumericValue] = colorScaleProps.domain ?? domainTuple;

    const { domain, range } = computeColorBins(colorScaleProps.fills, displayDomain, colorScaleProps.mode);
    colorScale.mode = colorScaleProps.mode;
    colorScale.domain = domain;
    colorScale.range = range;
    colorScale.displayDomain = displayDomain;
    colorScale.update();
}
