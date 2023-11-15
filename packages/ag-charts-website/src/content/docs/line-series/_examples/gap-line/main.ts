import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'People Born',
    },
    subtitle: {
        text: '2008-2020',
    },
    series: [
        {
            xKey: 'year',
            yKey: 'visitors',
        },
    ],
};

AgCharts.create(options);
