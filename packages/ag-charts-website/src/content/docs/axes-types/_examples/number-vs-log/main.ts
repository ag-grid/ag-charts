import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'A', share: 10 },
        { os: 'B', share: 100 },
        { os: 'C', share: 1000 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'os',
            yKey: 'share',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            label: {
                format: '.0f',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function setNumberAxis() {
    options.axes = [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            min: 1,
            label: {
                format: '.0f',
            },
        },
    ];
    chart.update(options);
}

function setLogAxis() {
    options.axes = [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'log',
            position: 'left',
            min: 10,
            label: {
                format: '.0f',
            },
        },
    ];
    chart.update(options);
}

function setBaseTwoLogAxis() {
    options.axes = [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'log',
            position: 'left',
            min: 10,
            label: {
                format: '.0f',
            },
            base: 2,
        },
    ];
    chart.update(options);
}

function setLogAxisWithFewerTicks() {
    options.axes = [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'log',
            position: 'left',
            min: 10,
            interval: {
                minSpacing: 200,
            },
            label: {
                format: '.0f',
            },
        },
    ];
    chart.update(options);
}
