import { HistogramSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([HistogramSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Race demographics',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            xKey: 'age',
            xName: 'Participant Age',
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
            title: { text: 'Number of participants' },
        },
    },
};

AgCharts.create(options);
