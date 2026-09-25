import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgCartesianChartOptions } from 'ag-charts-community';

import { SEQUENTIAL_BLUE, THEME } from '../chartTheme';
import type { ActivityCell } from '../types';

/** The React `ActivityHeatmapChart` renders only the chart; the host is the `.wa-fill` box around it. */
@Component({
    selector: 'div[waActivityHeatmapChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class ActivityHeatmapChart {
    readonly data = input.required<ActivityCell[]>();

    protected readonly options = computed<AgCartesianChartOptions>(() => ({
        theme: THEME,
        data: this.data(),
        series: [
            {
                type: 'heatmap',
                xKey: 'day',
                xName: 'Day of week',
                yKey: 'hour',
                yName: 'Hour of day',
                colorKey: 'sessions',
                colorName: 'Sessions',
                // Magnitude is sequential: one hue, light→dark, so busier hours read darker.
                colorScale: {
                    fills: SEQUENTIAL_BLUE.map((color) => ({ color })),
                },
                tooltip: {
                    renderer: ({ datum }) => {
                        const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
                        return {
                            title: `${datum.day} · ${hh(datum.hour)}–${hh(datum.hour + 1)}`,
                            data: [{ label: 'Sessions', value: datum.sessions }],
                        };
                    },
                },
                stroke: 'white',
                strokeWidth: 3,
                strokeOpacity: 1,
            },
        ],
        axes: {
            x: {
                type: 'category',
                position: 'top',
                line: { enabled: false },
            },
            y: {
                type: 'category',
                position: 'left',
                line: { enabled: false },
                // Thin the 24 hour labels so they stay legible.
                label: { formatter: ({ value }) => (Number(value) % 3 === 0 ? `${value}:00` : '') },
            },
        },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    }));
}
