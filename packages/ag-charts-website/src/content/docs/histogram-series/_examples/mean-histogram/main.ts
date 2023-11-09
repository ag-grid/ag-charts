import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Race results',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            aggregation: 'mean',
            xKey: 'age',
            xName: 'Participant Age',
            yKey: 'time',
            yName: 'Race time',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: { text: 'Age band (years)' },
            tick: { interval: 2 },
        },
        {
            type: 'number',
            position: 'left',
            title: { text: 'Mean race time (seconds)' },
        },
    ],
};

AgEnterpriseCharts.create(options);
