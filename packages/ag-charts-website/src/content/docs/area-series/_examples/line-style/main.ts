import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions, LegendModule } from 'ag-charts-community';
import { AreaSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
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
            type: 'area',
            xKey: 'month',
            yKey: 'subscriptions',
            yName: 'Subscriptions',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'products',
            yName: 'Products',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
    ],
};

const chart = AgCharts.create(options);

let interpolationType: 'linear' | 'smooth' | 'step' = 'smooth';
let stepPosition: 'start' | 'middle' | 'end' = 'end';

function typeChange(event: Event) {
    interpolationType = (event.target as HTMLInputElement).value as typeof interpolationType;

    const stepPositionGroup = document.getElementById('stepPositionGroup') as HTMLFieldSetElement;
    stepPositionGroup.disabled = interpolationType !== 'step';

    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation =
            interpolationType === 'step' ? { type: 'step', position: stepPosition } : { type: interpolationType };
    });
    chart.update(options);
}

function positionChange(event: Event) {
    stepPosition = (event.target as HTMLInputElement).value as typeof stepPosition;

    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation = { type: 'step', position: stepPosition };
    });
    chart.update(options);
}
