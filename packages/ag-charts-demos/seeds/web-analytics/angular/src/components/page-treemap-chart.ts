import { Component, computed, input } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type { AgChartOptions, AgTreemapSeriesOptions } from 'ag-charts-community';

import { THEME, pageColor } from '../chartTheme';
import { fmtInt } from '../format';
import type { PageRow } from '../types';

/** The React `PageTreemapChart` renders only the chart; the host is the chart box around it. */
@Component({
    selector: 'div[waPageTreemapChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class PageTreemapChart {
    readonly data = input.required<PageRow[]>();

    protected readonly options = computed<AgChartOptions>(() => {
        const series: AgTreemapSeriesOptions<PageRow> = {
            type: 'treemap',
            labelKey: 'pageTitle',
            secondaryLabelKey: 'pageviews',
            sizeKey: 'pageviews',
            sizeName: 'Page views',
            tile: {
                cornerRadius: 6,
                gap: 8,
                padding: 8,
                fillOpacity: 0.85,
                textAlign: 'left',
                verticalAlign: 'bottom',
                label: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    minimumFontSize: 10,
                },
                secondaryLabel: {
                    minimumFontSize: 9,
                    formatter: ({ value }) => fmtInt(Number(value)),
                },
            },
            itemStyler: ({ datum }) => ({ fill: pageColor(datum.pageTitle) }),
        };

        return {
            theme: THEME,
            data: this.data(),
            series: [series],
            padding: 0,
            formatter: {
                size: ({ value }) => fmtInt(Number(value)),
            },
        };
    });
}
