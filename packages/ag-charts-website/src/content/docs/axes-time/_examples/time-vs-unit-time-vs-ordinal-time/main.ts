import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'School Absences',
    },
    data: [
        { date: new Date(2024, 0, 1), value: 2 },
        { date: new Date(2024, 1, 1), value: 5 },
        { date: new Date(2024, 2, 1), value: 3 },
        { date: new Date(2024, 3, 1), value: 1 },
        { date: new Date(2024, 4, 1), value: 2 },
        { date: new Date(2024, 5, 1), value: 3 },
        { date: new Date(2024, 9, 1), value: 1 },
        { date: new Date(2024, 10, 1), value: 2 },
        { date: new Date(2024, 11, 1), value: 2 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            title: { text: 'Unit Time Axis' },
        },
    },
};

const chart = AgCharts.create(options);

function setContinuousTimeAxis() {
    options.axes = {
        x: {
            type: 'time',
            position: 'bottom',
            title: { text: 'Continuous Time Axis' },
        },
    };
    chart.update(options);
}

function setUnitTimeAxis() {
    options.axes = {
        x: {
            type: 'unit-time',
            position: 'bottom',
            title: { text: 'Unit Time Axis' },
        },
        y: {
            type: 'number',
            position: 'left',
        },
    };
    chart.update(options);
}

function setOrdinalTimeAxis() {
    options.axes = {
        x: {
            type: 'ordinal-time',
            position: 'bottom',
            interval: {
                step: 'month',
            },
            title: { text: 'Ordinal Time Axis' },
        },
        y: {
            type: 'number',
            position: 'left',
        },
    };
    chart.update(options);
}
