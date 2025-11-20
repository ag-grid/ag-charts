import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { HistogramSeriesModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([HistogramSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Race demographics',
    },
    subtitle: {
        text: 'Number of participants by age category',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            xKey: 'age',
            xName: 'Participant Age',
            areaPlot: true,
            bins: [
                [16, 18],
                [18, 21],
                [21, 25],
                [25, 40],
            ],
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: { text: 'Age category (years)' },
            interval: { step: 2 },
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Number of participants' },
        },
    },
};

AgCharts.create(options);
