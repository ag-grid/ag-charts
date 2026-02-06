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
        text: 'Quarterly Sales vs Targets',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'satisfactory',
            yName: 'Satisfactory',
            fillOpacity: 0.3,
            cornerRadius: 3,
            highlight: {
                enabled: false,
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'excellent',
            yName: 'Excellent',
            fillOpacity: 0.3,
            cornerRadius: 3,
            highlight: {
                enabled: false,
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'actual',
            yName: 'Actual',
            grouped: false,
            widthRatio: 0.7,
            cornerRadius: 6,
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
