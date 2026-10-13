import type { Group, NormalisedSeriesAreaBackgroundRegion } from 'ag-charts-core';

import type { AxisContext } from '../../module/axisContext';

export interface BackgroundRegion {
    labelGroup: Group;
    regionGroup: Group;
    xAxis?: AxisContext;
    yAxis?: AxisContext;
    setOptions(opts: NormalisedSeriesAreaBackgroundRegion): void;
    update(index: number): void;
}
