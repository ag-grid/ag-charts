import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScrollbarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, ScrollbarModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Quarterly Revenue by Product Line',
    },
    scrollbar: { enabled: true },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'software',
            yName: 'Software',
            width: 30,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'hardware',
            yName: 'Hardware',
            width: 30,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            width: 30,
        },
    ],
    axes: {
        x: {
            type: 'category',
        },
        y: {
            type: 'number',
            label: {
                formatter: ({ value }) => `$${(value / 1000).toFixed(1)}B`,
            },
        },
    },
};

const chart = AgCharts.create(options);

function toggleFixedWidth() {
    for (const series of options.series ?? []) {
        if (!('width' in series)) continue;
        series.width =
            series.width == null ? Number(document.getElementById('fixedWidthSliderValue')!.innerHTML) : undefined;
    }
    chart.update(options);
}

function updateFixedWidth(event: any) {
    const value = Number(event.target?.value);
    for (const series of options.series ?? []) {
        if (!('width' in series)) continue;
        series.width = value;
    }
    chart.update(options);
    document.getElementById('fixedWidthSliderValue')!.innerHTML = String(value);
}
