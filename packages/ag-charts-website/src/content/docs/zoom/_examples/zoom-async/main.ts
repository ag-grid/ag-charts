import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { FakeServer } from './fakeServer';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    dataSource: {
        getData: ({ windowStart, windowEnd }) => {
            // Request the data from the server, this is an asynchronous call which may take up to 500ms. In your
            // application, replace this with a call to your server api.
            return FakeServer.get({ windowStart, windowEnd });
        },
    },
    zoom: {
        enabled: true,
        minVisibleItemsX: 1,
        minVisibleItemsY: 1,
    },
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'price',
            yName: 'Price',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            keys: ['price'],
            max: 1000,
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            min: new Date('2024-01-01 00:00:00'),
            max: new Date('2024-12-30 23:59:59'),
            tick: {
                minSpacing: 50,
                maxSpacing: 100,
            },
            label: {
                formatter: ({ value }) => Intl.DateTimeFormat('en-GB', { month: 'short' }).format(new Date(value)),
            },
        },
    ],
};

AgCharts.create(options);
