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
    navigator: {
        enabled: true,
    },
    zoom: {
        enabled: true,
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
            min: 400,
            max: 1600,
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            min: new Date('2019-01-01 00:00:00'),
            max: new Date('2024-12-30 23:59:59'),
            tick: {
                minSpacing: 100,
                maxSpacing: 200,
            },
            label: {
                formatter: ({ value }) =>
                    Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                    }).format(new Date(value)),
            },
        },
    ],
};

AgCharts.create(options);
