import type { AxisID, ChartAxisDirection, Group, Scale } from 'ag-charts-core';

/** Interface to abstract from the actual chart implementation. */
export interface ChartLike {
    context?: unknown;
    axes: AxisLike[];
    series: SeriesLike[];
    seriesRoot: Group;
}

export interface AxisLike {
    id: AxisID;
    type: string;
    scale: Scale<any, any>;
    direction: ChartAxisDirection;
}

interface SeriesLike {
    type: string;
    hasData: boolean;
    visible: boolean;
}

export interface UpdateProcessor {
    destroy(): void;
}
