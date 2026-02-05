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
        text: 'Music Revenue Trends, 2004–2024',
    },
    subtitle: {
        text: 'The Evolution of Music Formats',
    },
    footnote: {
        text: 'Data represents global music revenue (in millions of USD) by format, based on historical trends and estimates.',
    },
    scrollbar: { enabled: true },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'cd',
            yName: 'CD',
            width: 20,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'streaming',
            yName: 'Streaming',
            width: 20,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'digitalDownloads',
            yName: 'Digital Downloads',
            width: 20,
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
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
