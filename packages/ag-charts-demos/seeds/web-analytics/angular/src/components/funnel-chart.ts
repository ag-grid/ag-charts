import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgChartOptions, AgFunnelSeriesOptions } from 'ag-charts-community';

import { FUNNEL_COLORS, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { FunnelStep } from '../types';

/** The React `FunnelChart` renders only the chart; the host is the chart box around it. */
@Component({
    selector: 'div[waFunnelChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class FunnelChart {
    readonly data = input.required<FunnelStep[]>();

    protected readonly options = computed<AgChartOptions>(() => {
        const series: AgFunnelSeriesOptions = {
            type: 'funnel',
            stageKey: 'stepName',
            valueKey: 'sessionsEntering',
            fills: FUNNEL_COLORS,
            strokeWidth: 0,
            cornerRadius: 5,
            stageLabel: {
                enabled: false,
            },
            label: {
                placement: ['inside-center', 'outside-after'],
                formatter: ({ datum }) => [
                    { text: datum.stepName, fontSize: 13, fontWeight: 'bold' },
                    { text: '\n' },
                    { text: fmtInt(datum.sessionsEntering), fontSize: 12, color: 'white' },
                ],
            },
        };
        return {
            theme: THEME,
            data: this.data(),
            series: [series],
            padding: 0,
            formatter: {
                y: ({ value }) => fmtInt(Number(value)),
            },
        };
    });
}
