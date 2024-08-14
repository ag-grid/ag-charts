import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgCharts,
    AgSeriesTooltip,
} from 'ag-charts-enterprise';

import { data } from './data';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const tooltip: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams> = {
    renderer: ({ datum, xKey, yKey }) => ({
        content: `${dateFormatter.format(datum[xKey])}: ${numberFormatter.format(datum[yKey])}`,
    }),
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Market Data',
    },
    subtitle: {
        text: 'Last 5 years',
    },
    data: data,
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'AAPL',
            marker: {
                enabled: false,
            },
            tooltip,
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'MSFT',
            marker: {
                enabled: false,
            },
            tooltip,
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'AMZN',
            marker: {
                enabled: false,
            },
            tooltip,
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            interval: {
                maxSpacing: 200,
            },
            crosshair: {
                label: {
                    renderer: ({ value }) => {
                        return { text: dateFormatter.format(value) };
                    },
                },
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => numberFormatter.format(+params.value),
            },
        },
    ],
    legend: {
        enabled: true,
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
            label: {
                fontSize: 20,
                fontWeight: 'bold',
            },
        },
    },
    zoom: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.9, end: 1 },
        },
    },
};

const chart = AgCharts.create(options);
