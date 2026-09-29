import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgChartOptions, AgMapShapeSeriesOptions } from 'ag-charts-community';

import { SEQUENTIAL_BLUE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import { topology } from '../topology';
import type { CountryDatum } from '../types';

/** The React `GeoMap` renders only the chart; the host is the `.wa-fill` box around it. */
@Component({
    selector: 'div[waGeoMap]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class GeoMap {
    readonly data = input.required<CountryDatum[]>();

    // The "Unknown" bucket has no matching geography, so it can't be placed.
    private readonly mapData = computed(() => this.data().filter((row) => row.country !== 'Unknown'));

    protected readonly options = computed<AgChartOptions>(() => {
        const shape: AgMapShapeSeriesOptions = {
            type: 'map-shape',
            idKey: 'country',
            colorKey: 'sessions',
            colorName: 'Sessions',
            topologyIdKey: 'name',
            colorScale: {
                fills: SEQUENTIAL_BLUE.map((color) => ({ color })),
            },
        };
        return {
            theme: THEME,
            topology,
            data: this.mapData(),
            series: [{ type: 'map-shape-background' }, shape],
            gradientLegend: { enabled: true },
            padding: 0,
            // Formats the session count wherever it appears — tooltip and legend scale.
            formatter: {
                color: ({ value }) => fmtInt(Number(value)),
            },
        };
    });
}
