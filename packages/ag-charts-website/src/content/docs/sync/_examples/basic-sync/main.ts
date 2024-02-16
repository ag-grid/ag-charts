import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { AAPL, MSFT } from './data';

const options: AgCartesianChartOptions = {
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    tooltip: {
        enabled: false,
    },
    sync: {
        enabled: true,
        axes: 'x',
        nodeInteraction: true,
    },
    zoom: {
        enabled: true,
        enableSelecting: true,
    },
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            tick: {
                maxSpacing: 180,
            },
            crosshair: {
                label: {
                    format: '%d %b %Y',
                },
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                format: '$~s',
            },
        },
    ],
};

const chart1 = AgCharts.create({
    ...options,
    data: AAPL,
    title: {
        text: 'Apple (AAPL)',
        textAlign: 'left',
    },
    container: document.getElementById('myChart1'),
});

const chart2 = AgCharts.create({
    ...options,
    data: MSFT,
    title: {
        text: 'Microsoft (MSFT)',
        textAlign: 'left',
    },
    container: document.getElementById('myChart2'),
    navigator: {
        min: 0.8,
        max: 1,
    },
});
