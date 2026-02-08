import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Quarterly Revenue by Product Line',
    },
    subtitle: {
        text: 'Revenue in millions (USD)',
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
            type: 'ordinal-time',
            label: {
                formatter: ({ value }) => {
                    const date = new Date(value);
                    const q = Math.floor(date.getMonth() / 3) + 1;
                    const year = String(date.getFullYear()).slice(2);
                    return `Q${q} '${year}`;
                },
            },
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
