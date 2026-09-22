import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';

import { NEUTRAL, SEGMENT_SEPARATOR, THEME } from '../chartTheme';
import { fmtCurrency, fmtPct } from '../format';
import type { SupplierShareRow } from '../types';
import { AfterRender } from '../ui';

/**
 * Supplier share of each subcategory, normalised to 100%.
 *
 * The single-sourcing view: a subcategory drawn as one unbroken band has no second source, and
 * that is a supply risk regardless of how well the incumbent is performing. The sunburst holds
 * the same data, but as angles inside separate parents — which makes comparing concentration
 * *across* subcategories much harder than comparing bands on a shared 0–100% axis.
 *
 * Reads the whole period rather than the current selection, and emits none of its own: the two
 * spend charts answer the same question at different grains, and dimming one from the other's
 * selection hides exactly the comparison the pair exists to support.
 *
 * The host is the chart's container, the `<div>` the React `AgCharts` wrapper renders.
 */
@Component({
    selector: 'div[pcSupplierShareChart]',
    imports: [AfterRender, AgCharts],
    host: { style: 'height: 100%; width: 100%;' },
    template: '<ag-charts *pcAfterRender style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class SupplierShareChart {
    readonly rows = input.required<SupplierShareRow[]>();
    readonly supplierNames = input.required<Map<string, string>>();
    readonly supplierColors = input.required<Record<string, string>>();

    protected readonly options = computed<AgCartesianChartOptions<SupplierShareRow>>(() => {
        const supplierNames = this.supplierNames();
        const supplierColors = this.supplierColors();

        const series = [...supplierNames.entries()].map<AgBarSeriesOptions<SupplierShareRow>>(([supplierId, name]) => {
            const color = supplierColors[supplierId] ?? NEUTRAL;
            return {
                type: 'bar',
                direction: 'horizontal',
                xKey: 'subcategory',
                yKey: name,
                yName: name,
                stacked: true,
                normalizedTo: 100,
                fill: color,
                ...SEGMENT_SEPARATOR,
                tooltip: {
                    renderer: ({ datum }) => {
                        const spend = Number(datum[name] ?? 0);
                        const total = [...supplierNames.values()].reduce(
                            (sum, key) => sum + Number(datum[key] ?? 0),
                            0
                        );
                        return {
                            title: `${name} · ${datum.subcategory}`,
                            data: [
                                { label: 'Spend', value: fmtCurrency(spend) },
                                { label: 'Share of subcategory', value: total > 0 ? fmtPct(spend / total) : '—' },
                            ],
                        };
                    },
                },
            };
        });

        return {
            theme: THEME,
            data: this.rows(),
            series,
            // Horizontal bars: the subcategory axis sits on the left, share on the bottom.
            axes: {
                y: { type: 'category', position: 'left' },
                x: {
                    type: 'number',
                    position: 'bottom',
                    title: { enabled: true, text: 'Share of subcategory spend' },
                    label: { formatter: ({ value }) => `${value}%` },
                },
            },
            legend: { enabled: true, position: 'bottom' },
            padding: { top: 8, right: 12, bottom: 4, left: 4 },
        };
    });
}
