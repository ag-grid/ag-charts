import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgAreaSeriesOptions, AgCartesianChartOptions, AgLineSeriesOptions } from 'ag-charts-community';

import { NEUTRAL, PALETTE, THEME } from '../chartTheme';
import { fmtCurrency, fmtCurrencyCompact, fmtDate, fmtPct } from '../format';
import type { BurnUpPoint } from '../types';
import { AfterRender } from '../ui';

/**
 * Committed spend against a straight-line budget pace, across the whole period.
 *
 * The worklist can say she is at 92% of the quarter's allocation; only this shows whether that
 * is a steady drift or a step change, and where the current trajectory lands. Both matter,
 * because the response differs: a drift needs a volume conversation, a step needs an
 * explanation. The pace line runs to the end of the period while the committed area stops at
 * today, so the gap between them is the remaining runway.
 *
 * The host is the chart's container, the `<div>` the React `AgCharts` wrapper renders.
 */
@Component({
    selector: 'div[pcBudgetBurnUp]',
    imports: [AfterRender, AgCharts],
    host: { style: 'height: 100%; width: 100%;' },
    template: '<ag-charts *pcAfterRender style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class BudgetBurnUp {
    readonly points = input.required<BurnUpPoint[]>();
    /** The allocation the pace line runs to. */
    readonly budget = input.required<number>();

    protected readonly options = computed<AgCartesianChartOptions<BurnUpPoint>>(() => {
        const points = this.points();
        const budget = this.budget();

        const committed: AgAreaSeriesOptions<BurnUpPoint> = {
            type: 'area',
            xKey: 'date',
            yKey: 'committed',
            yName: 'Committed',
            fill: PALETTE[0],
            fillOpacity: 0.18,
            stroke: PALETTE[0],
            strokeWidth: 2,
            marker: { enabled: false },
            // The series ends at today rather than flattening across the remaining period.
            connectMissingData: false,
            tooltip: {
                renderer: ({ datum }) => ({
                    title: fmtDate(datum.date),
                    data: [
                        { label: 'Committed', value: fmtCurrency(datum.committed ?? 0) },
                        { label: 'Of allocation', value: fmtPct((datum.committed ?? 0) / budget) },
                        { label: 'Pace would be', value: fmtCurrency(datum.pace) },
                    ],
                }),
            },
        };

        const pace: AgLineSeriesOptions<BurnUpPoint> = {
            type: 'line',
            xKey: 'date',
            yKey: 'pace',
            yName: 'Budget pace',
            stroke: NEUTRAL,
            strokeWidth: 1.5,
            lineDash: [5, 4],
            marker: { enabled: false },
            tooltip: { enabled: false },
        };

        return {
            theme: THEME,
            data: points,
            series: [pace, committed],
            axes: {
                x: { type: 'time', position: 'bottom' },
                y: {
                    type: 'number',
                    position: 'left',
                    title: { enabled: true, text: 'Committed spend' },
                    label: { formatter: ({ value }) => fmtCurrencyCompact(value) },
                    crossLines: [
                        {
                            type: 'line',
                            value: budget,
                            stroke: 'var(--pc-accent)',
                            strokeWidth: 1,
                            label: {
                                enabled: true,
                                text: `${fmtCurrencyCompact(budget)} allocation`,
                                position: 'top-left',
                                color: 'var(--pc-accent)',
                                fontSize: 11,
                            },
                        },
                    ],
                },
            },
            legend: { enabled: true, position: 'bottom' },
            padding: { top: 8, right: 12, bottom: 4, left: 4 },
        };
    });
}
