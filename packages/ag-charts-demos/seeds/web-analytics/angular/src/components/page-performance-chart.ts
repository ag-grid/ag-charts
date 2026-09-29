import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgCartesianChartOptions } from 'ag-charts-community';

import { PALETTE, THEME } from '../chartTheme';
import { fmtInt, fmtPct } from '../format';
import type { PageRow } from '../types';

/**
 * Pages ranked by pageviews (bars, bottom axis) alongside their conversion rate (bars, top axis) — a
 * dual value-axis horizontal bar chart. The React component renders only the chart; the host is the
 * chart box around it.
 */
@Component({
    selector: 'div[waPagePerformanceChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class PagePerformanceChart {
    readonly data = input.required<PageRow[]>();

    private readonly rows = computed(() => [...this.data()].sort((a, b) => a.pageviews - b.pageviews));

    protected readonly options = computed<AgCartesianChartOptions>(() => ({
        theme: THEME,
        data: this.rows(),
        series: [
            {
                type: 'bar',
                direction: 'horizontal',
                xKey: 'pageTitle',
                yKey: 'pageviews',
                yName: 'Page views',
                xKeyAxis: 'page',
                yKeyAxis: 'views',
                fill: PALETTE[0],
                cornerRadius: 2,
            },
            {
                type: 'bar',
                direction: 'horizontal',
                xKey: 'pageTitle',
                yKey: 'conversionRate',
                yName: 'Conversion rate',
                xKeyAxis: 'page',
                yKeyAxis: 'rate',
                fill: PALETTE[1],
                cornerRadius: 2,
            },
        ],
        axes: {
            page: {
                type: 'category',
                position: 'left',
                label: {
                    truncate: true,
                },
            },
            views: {
                type: 'number',
                position: 'bottom',
                title: {
                    text: 'Page views',
                    fontStyle: 'italic',
                    color: { ref: 'textColor', mix: 0.2, ontoColor: PALETTE[0] },
                    spacing: 2,
                },
                label: {
                    formatter: ({ value }) => fmtInt(value),
                    spacing: 2,
                    color: { ref: 'textColor', mix: 0.2, ontoColor: PALETTE[0] },
                },
            },
            rate: {
                type: 'number',
                position: 'top',
                title: {
                    text: 'Conversion rate',
                    fontStyle: 'italic',
                    color: { ref: 'textColor', mix: 0.2, ontoColor: PALETTE[1] },
                    spacing: 2,
                },
                label: {
                    formatter: ({ value }) => fmtPct(Number(value)),
                    spacing: 2,
                    color: { ref: 'textColor', mix: 0.2, ontoColor: PALETTE[1] },
                },
            },
        },
        legend: { enabled: false, position: 'bottom' },
        padding: { top: 0, right: 4, bottom: 0, left: 0 },
    }));
}
