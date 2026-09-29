import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgCartesianChartOptions } from 'ag-charts-community';

import { PALETTE, THEME } from '../chartTheme';
import { fmtDuration, fmtInt } from '../format';
import type { Session } from '../types';

/**
 * Distribution of session durations. The histogram bins the raw per-session duration values and
 * counts sessions per bin. The React component renders only the chart; the host is the chart box
 * around it.
 */
@Component({
    selector: 'div[waDurationHistogramChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class DurationHistogramChart {
    readonly sessions = input.required<Session[]>();

    protected readonly options = computed<AgCartesianChartOptions>(() => ({
        theme: THEME,
        data: this.sessions(),
        series: [
            {
                type: 'histogram',
                xKey: 'sessionDuration',
                xName: 'Session duration',
                yName: 'Sessions',
                binCount: 24,
                fill: PALETTE[0],
                stroke: 'white',
                strokeWidth: 1,
                cornerRadius: 4,
                tooltip: {
                    renderer: () => ({
                        symbol: { marker: { enabled: false } },
                    }),
                },
            },
        ],
        axes: {
            x: {
                type: 'number',
                position: 'bottom',
                label: { formatter: ({ value }) => fmtDuration(value) },
                gridLine: {
                    enabled: false,
                },
                nice: false,
            },
            y: {
                type: 'number',
                position: 'left',
                nice: false,
            },
        },
        formatter: {
            y: ({ value }) => fmtInt(Number(value)),
        },
        legend: { enabled: false },
        padding: { top: 8, right: 0, bottom: 0, left: 0 },
    }));
}
