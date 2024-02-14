import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { FakeServer } from './fakeServer';

let options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Lazy Load with Navigator & Range',
    },
    subtitle: {
        text: 'Fetches ALL the data for the entire period, irregardless the range',
    },
    data: (({ axes }: any) => {
        const timeAxis = axes ? axes.find((a: any) => a.type === 'time') : undefined;
        if (!timeAxis) return [];

        // Request the data from the server, this is an asynchronous call which may take up to 500ms. In your
        // application, replace this with a call to your server api.
        return FakeServer.get({ range: 'year' });
    }) as any,
    navigator: {
        min: 0,
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
            min: new Date('2024-01-01 00:00:00'),
            max: new Date('2024-12-30 23:59:59'),
            tick: {
                minSpacing: 50,
                maxSpacing: 200,
            },
        },
    ],
};

const chart = AgCharts.create(options);

function changeRange(range: 'day' | 'month' | 'year') {
    // TODO: replace this ratio api with one that uses the domain
    let min = 0;
    const end = new Date('2024-12-30 23:59:59').getTime();
    if (range === 'month') {
        min = new Date('2024-12-01 00:00:00').getTime() / end;
    } else if (range === 'day') {
        min = new Date('2024-12-30 00:00:00').getTime() / end;
    }

    options = {
        ...options,
        data: (({ axes }: any) => {
            const timeAxis = axes ? axes.find((a: any) => a.type === 'time') : undefined;
            if (!timeAxis) return [];

            // Request the data from the server, this is an asynchronous call which may take up to 500ms. In your
            // application, replace this with a call to your server api.
            return FakeServer.get({ range });
        }) as any,
        navigator: {
            min,
            max: 1,
        },
    };
    AgCharts.update(chart, options);
}
