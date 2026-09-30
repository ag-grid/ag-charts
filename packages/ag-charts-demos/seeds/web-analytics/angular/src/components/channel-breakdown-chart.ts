import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgCartesianChartOptions } from 'ag-charts-community';

import { PALETTE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { ChannelDatum } from '../types';

/** The React `ChannelBreakdownChart` renders only the chart; the host is the chart box around it. */
@Component({
    selector: 'div[waChannelBreakdownChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class ChannelBreakdownChart {
    readonly data = input.required<ChannelDatum[]>();

    protected readonly options = computed<AgCartesianChartOptions>(() => ({
        theme: THEME,
        data: this.data(),
        series: [
            {
                type: 'bar',
                direction: 'horizontal',
                xKey: 'channel',
                yKey: 'sessions',
                yName: 'Sessions',
                fillOpacity: 0.2,
                width: 12,
                label: {
                    enabled: true,
                    placement: 'outside-end',
                    spacing: 12,
                    fontWeight: 'bold',
                },
                highlight: {
                    enabled: false,
                },
            },
            {
                type: 'scatter',
                xKey: 'sessions',
                yKey: 'channel',
                size: 12,
                fillOpacity: 1,
                fill: PALETTE[0],
                stroke: PALETTE[0],
                highlight: {
                    enabled: false,
                },
            },
        ],
        // Horizontal bars: the category axis sits on the left, the value axis on the bottom.
        axes: {
            y: { type: 'category', position: 'left' },
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
        // Formats the session count on the bar labels.
        formatter: {
            y: ({ value }) => fmtInt(Number(value)),
        },
        tooltip: {
            enabled: false,
        },
    }));
}
