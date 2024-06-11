import { AgChartOptions, AgCharts, time } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'temp',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: {
                format: '$#{0>6.2f}',
            },
        },
        {
            type: 'time',
            nice: false,
            position: 'bottom',
            interval: { step: time.month },
            label: {
                format: '%b %Y',
            },
        },
    ],
    data: [
        {
            date: new Date('01 Jan 2019 00:00:00 GMT'),
            temp: 82.0,
        },
        {
            date: new Date('01 Feb 2019 00:00:00 GMT'),
            temp: 75.0,
        },
        {
            date: new Date('01 Mar 2019 00:00:00 GMT'),
            temp: 62.0,
        },
        {
            date: new Date('01 Apr 2019 00:00:00 GMT'),
            temp: 99.0,
        },
        {
            date: new Date('01 May 2019 00:00:00 GMT'),
            temp: 82.0,
        },
    ],
};

AgCharts.create(options);
