import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgPolarChartOptions } from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { DeviceDatum } from '../types';

/** The React `DeviceBreakdownChart` renders only the chart; the host is the chart box around it. */
@Component({
    selector: 'div[waDeviceBreakdownChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class DeviceBreakdownChart {
    readonly data = input.required<DeviceDatum[]>();

    // Collapse the new/returning split into a single total per device.
    private readonly totals = computed(() =>
        this.data().map((d) => ({ device: d.device, sessions: d.new + d.returning }))
    );

    protected readonly options = computed<AgPolarChartOptions>(() => ({
        theme: THEME,
        data: this.totals(),
        series: [
            {
                type: 'donut',
                angleKey: 'sessions',
                legendItemKey: 'device',
                cornerRadius: 4,
                innerRadiusRatio: 0.8,
                tooltip: {
                    renderer: () => ({
                        symbol: { marker: { shape: 'circle' } },
                    }),
                },
            },
        ],
        legend: {
            enabled: true,
            position: 'right',
            spacing: 24,
            maxWidth: 240,
            item: {
                label: {
                    formatter: ({ datum }) => `${datum.device} - ${fmtInt(datum.sessions)}`,
                },
                marker: {
                    shape: 'circle',
                    size: 12,
                },
            },
        },
        formatter: {
            angle: ({ value }) => fmtInt(Number(value)),
        },
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
    }));
}
