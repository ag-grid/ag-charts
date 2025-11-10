import type { AxisID, Padding, Scale } from 'ag-charts-core';

import type { Group } from '../../scene/group';

/** Interface to abstract from the actual chart implementation. */
export interface ChartLike {
    context?: unknown;
    axes: AxisLike[];
    series: SeriesLike[];
    seriesRoot: Group;
    padding: Padding;
}

export interface AxisLike {
    id: AxisID;
    type: string;
    scale: Scale<any, any>;
}

interface SeriesLike {
    type: string;
    hasData: boolean;
    visible: boolean;
}

export interface UpdateProcessor {
    destroy(): void;
}
