import { ChartAxisDirection } from 'ag-charts-core';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { type ChartOrProxy, deproxy } from './utils';

/** A two-bar chart topping out at `peak`, synchronised on both axes within `groupId`. */
export function syncedPeakChartOptions(peak: number, groupId: string, xTitle = 'Year'): AgCartesianChartOptions {
    return {
        width: 250,
        height: 300,
        animation: { enabled: false },
        data: [
            { year: '2020', value: peak / 2 },
            { year: '2021', value: peak },
        ],
        series: [{ type: 'bar', xKey: 'year', yKey: 'value' }],
        axes: {
            x: { type: 'category', position: 'bottom', title: { text: xTitle } },
            y: { type: 'number', position: 'left' },
        },
        sync: { groupId, axes: 'xy' },
    };
}

export function syncedYDomain(chart: ChartOrProxy) {
    return deproxy(chart).axes.find((axis) => axis.direction === ChartAxisDirection.Y)!.dataDomain.domain;
}

export function syncGroupSize(chart: ChartOrProxy, groupId: string) {
    return deproxy(chart).ctx.syncManager.getGroupMembers(groupId).length;
}
