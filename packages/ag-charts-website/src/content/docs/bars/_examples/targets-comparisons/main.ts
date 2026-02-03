import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Quarterly Sales vs Target',
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'target',
            yName: 'Target',
            grouped: false,
            widthRatio: 0.8,
            fillOpacity: 0.3,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'europe',
            yName: 'Europe',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'asia',
            yName: 'Asia',
        },
    ],
};

const chart = AgCharts.create(options);

function updateWidthRatio(event: any) {
    const value = Number(event.target?.value);
    for (const series of options.series ?? []) {
        if (!('widthRatio' in series)) continue;
        series.widthRatio = value;
    }
    chart.update(options);
    document.getElementById('widthRatioSliderValue')!.innerHTML = String(value);
}
