import { AgCartesianChartOptions, AgCharts, time } from 'ag-charts-enterprise';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'School Absences',
    },
    data: [
        { date: new Date('2024-01-01'), value: 2 },
        { date: new Date('2024-02-01'), value: 5 },
        { date: new Date('2024-03-01'), value: 3 },
        { date: new Date('2024-04-01'), value: 1 },
        { date: new Date('2024-05-01'), value: 2 },
        { date: new Date('2024-09-01'), value: 3 },
        { date: new Date('2024-10-01'), value: 1 },
        { date: new Date('2024-11-01'), value: 2 },
        { date: new Date('2024-12-01'), value: 2 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
};

const chart = AgCharts.create(options);

function setTimeAxis() {
    options.axes = [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ];
    chart.update(options);
}

function setUnitTimeAxis() {
    options.axes = [
        {
            type: 'time',
            position: 'bottom',
            unit: time.month,
        },
        {
            type: 'number',
            position: 'left',
        },
    ];
    chart.update(options);
}

function setOrdinalTimeAxis() {
    options.axes = [
        {
            type: 'ordinal-time',
            position: 'bottom',
            interval: {
                step: time.month,
            },
        },
        {
            type: 'number',
            position: 'left',
        },
    ];
    chart.update(options);
}
