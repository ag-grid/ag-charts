import type { NormalisedSeriesAreaBackgroundRegion, Scale } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import type { Group } from '../../scene/group';

export interface BackgroundRegion {
    labelGroup: Group;
    regionGroup: Group;
    xScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
    yScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
    setOptions(opts: NormalisedSeriesAreaBackgroundRegion): void;
    update(visible: boolean): void;
}
