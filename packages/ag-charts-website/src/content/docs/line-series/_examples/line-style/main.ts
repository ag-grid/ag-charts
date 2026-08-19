import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: '2023 Average Temperatures',
    },
    subtitle: {
        text: 'Oxford, UK',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            xName: 'Month',
            yKey: 'min',
            yName: 'Min Temperature',
            interpolation: { type: 'smooth' },
        },
        {
            type: 'line',
            xKey: 'month',
            xName: 'Month',
            yKey: 'max',
            yName: 'Max Temperature',
            interpolation: { type: 'smooth' },
        },
    ],
};

const chart = AgCharts.create(options);

let interpolationType: 'linear' | 'smooth' | 'step' = 'smooth';
let stepPosition: 'start' | 'middle' | 'end' = 'end';

function typeChange(event: Event) {
    interpolationType = (event.target as HTMLInputElement).value as 'linear' | 'smooth' | 'step';

    const stepPositionGroup = document.getElementById('stepPositionGroup') as HTMLFieldSetElement;
    stepPositionGroup.disabled = interpolationType !== 'step';

    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation =
            interpolationType === 'step' ? { type: 'step', position: stepPosition } : { type: interpolationType };
    });
    chart.update(options);
}

function positionChange(event: Event) {
    stepPosition = (event.target as HTMLInputElement).value as 'start' | 'middle' | 'end';

    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation = { type: 'step', position: stepPosition };
    });
    chart.update(options);
}
