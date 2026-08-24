import type { NormalisedSeriesAreaBackgroundRegion } from 'ag-charts-core';

import type { AxisContext } from '../../module/axisContext';
import type { Group } from '../../scene/group';

export interface BackgroundRegion {
    labelGroup: Group;
    regionGroup: Group;
    xAxis?: AxisContext;
    yAxis?: AxisContext;
    setOptions(opts: NormalisedSeriesAreaBackgroundRegion): void;
    update(): void;
}
