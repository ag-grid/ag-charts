import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgCartesianChartOptions } from 'ag-charts-community';

import { browserIconUrl } from '../browsers';
import { PALETTE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { Browser } from '../types';

/** The React `BrowserBreakdownChart` renders only the chart; the host is the chart box around it. */
@Component({
    selector: 'div[waBrowserBreakdownChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class BrowserBreakdownChart {
    readonly data = input.required<{ browser: Browser; sessions: number }[]>();

    // Descending: largest browser at the top of the horizontal bars.
    private readonly sorted = computed(() => [...this.data()].sort((a, b) => b.sessions - a.sessions));

    protected readonly options = computed<AgCartesianChartOptions>(() => ({
        theme: THEME,
        data: this.sorted(),
        series: [
            {
                type: 'bar',
                direction: 'horizontal',
                xKey: 'browser',
                yKey: 'sessions',
                yName: 'Sessions',
                fillOpacity: 0.2,
                width: 12,
                label: {
                    enabled: true,
                    placement: 'outside-end',
                    spacing: 12,
                    fontWeight: 'bold',
                    formatter: ({ value }) => fmtInt(value),
                },
                highlight: {
                    enabled: false,
                },
            },
            {
                type: 'scatter',
                xKey: 'sessions',
                yKey: 'browser',
                size: 12,
                fillOpacity: 1,
                fill: PALETTE[0],
                stroke: PALETTE[0],
                highlight: {
                    enabled: false,
                },
            },
        ],
        axes: {
            y: {
                type: 'category',
                position: 'left',
                label: {
                    formatter: ({ value }) => {
                        const url = browserIconUrl(String(value));
                        if (!url) return String(value);
                        return [
                            { type: 'image', url, width: 14, height: 14, verticalAlign: 'middle' },
                            { text: `  ${value}` },
                        ];
                    },
                },
            },
            x: {
                type: 'number',
                position: 'bottom',
                nice: false,
                gridLine: { width: 0 },
                label: { enabled: false },
            },
        },
        legend: { enabled: false },
        padding: { top: 8, right: 48, bottom: 8, left: 8 },
        tooltip: {
            enabled: false,
        },
    }));
}
