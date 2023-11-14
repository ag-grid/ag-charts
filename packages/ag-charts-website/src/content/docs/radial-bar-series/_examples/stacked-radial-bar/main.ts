import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'software',
            angleName: 'Software',
            stacked: true,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hardware',
            angleName: 'Hardware',
            stacked: true,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
            stacked: true,
        },
    ],
};

AgChart.create(options);
