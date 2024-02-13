import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { FakeServer } from './fakeServer';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: (({ axes }: any) => {
        const timeAxis = axes ? axes.find((a: any) => a.type === 'time') : undefined;
        if (!timeAxis) return [];

        // Request the data from the server, this is an asynchronous call which may take up to 500ms. In your
        // application, replace this with a call to your server api.
        return FakeServer.get({ min: timeAxis.min, max: timeAxis.max });
    }) as any,
    navigator: {
        min: 0.95,
        max: 1,
    },
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'price',
            yName: 'Price',
        },
        {
            type: 'bar',
            xKey: 'time',
            yKey: 'quantity',
            yName: 'Quantity',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            keys: ['price'],
        },
        {
            type: 'number',
            position: 'right',
            keys: ['quantity'],
            max: 100,
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            min: new Date('2024-01-01'),
            max: new Date('2024-07-01'),
            tick: {
                minSpacing: 50,
                maxSpacing: 200,
            },
        },
    ],
};

AgCharts.create(options);
