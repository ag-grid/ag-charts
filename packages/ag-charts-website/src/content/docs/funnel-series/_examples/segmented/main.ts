import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue Open by Sales Stage',
    },
    series: [
        {
            type: 'funnel',
            xKey: 'group',
            yKey: 'value',
            dropOff: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);