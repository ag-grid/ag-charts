import type { BBox, Group, NormalisedSeriesAreaBackgroundRegion } from 'ag-charts-core';

import type { AxisContext } from '../../module/axisContext';

export interface BackgroundRegion {
    labelGroup: Group;
    regionGroup: Group;
    xAxis?: AxisContext;
    yAxis?: AxisContext;
    setOptions(opts: NormalisedSeriesAreaBackgroundRegion): void;
    update(index: number): void;
    /** The drawn label's canvas footprint, or `undefined` when no label is shown. */
    getLabelBox(): BBox | undefined;
}
