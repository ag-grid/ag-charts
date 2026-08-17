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

function interpolationChange(event: Event) {
    const interpolations: Record<string, AgLineSeriesOptions['interpolation']> = {
        linear: { type: 'linear' },
        smooth: { type: 'smooth' },
        'step-start': { type: 'step', position: 'start' },
        'step-middle': { type: 'step', position: 'middle' },
        'step-end': { type: 'step', position: 'end' },
    };
    const interpolation = interpolations[(event.target as HTMLInputElement).value];
    options.series?.forEach((series) => {
        (series as AgLineSeriesOptions).interpolation = interpolation;
    });
    chart.update(options);
}
