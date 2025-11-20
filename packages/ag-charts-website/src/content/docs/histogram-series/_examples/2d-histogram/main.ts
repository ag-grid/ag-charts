import { HistogramSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([HistogramSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Prize money distribution',
    },
    subtitle: {
        text: 'Total winnings by participant age',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            xKey: 'age',
            xName: 'Participant Age',
            yKey: 'winnings',
            yName: 'Winnings',
            aggregation: 'sum',
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: { text: 'Age band (years)' },
            interval: { step: 2 },
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Total winnings (USD)' },
        },
    },
};

AgCharts.create(options);
