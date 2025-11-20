import { HistogramSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([HistogramSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Race demographics',
    },
    subtitle: {
        text: 'Number of participants by age',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            xKey: 'age',
            xName: 'Participant Age',
            binCount: 20,
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: { text: 'Age (years)' },
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Number of participants' },
        },
    },
};

AgCharts.create(options);
