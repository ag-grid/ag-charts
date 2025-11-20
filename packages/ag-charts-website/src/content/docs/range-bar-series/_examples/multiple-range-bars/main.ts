import { ModuleRegistry, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { RangeBarSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([NumberAxisModule, RangeBarSeriesModule, TimeAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Digital Subscriptions`,
    },
    subtitle: {
        text: `In Thousands`,
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'date',
            yLowKey: 'start',
            yHighKey: 'gain',
            xName: 'Month',
            yLowName: 'Start',
            yHighName: 'End',
            yName: 'Gained',
        },
        {
            type: 'range-bar',
            xKey: 'date',
            yLowKey: 'loss',
            yHighKey: 'gain',
            xName: 'Month',
            yLowName: 'End',
            yHighName: 'Start',
            yName: 'Lost',
        },
    ],
};

AgCharts.create(options);
