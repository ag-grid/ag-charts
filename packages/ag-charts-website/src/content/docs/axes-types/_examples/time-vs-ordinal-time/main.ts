import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { date: new Date('2024-04-22'), value: 10 }, // Monday
        { date: new Date('2024-04-23'), value: 20 }, // Tuesday
        { date: new Date('2024-04-24'), value: 30 }, // Wednesday
        { date: new Date('2024-04-25'), value: 40 }, // Thursday
        { date: new Date('2024-04-26'), value: 50 }, // Friday
        // Skipping Saturday and Sunday
        { date: new Date('2024-04-29'), value: 60 }, // Monday
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
            type: 'ordinal-time',
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

function setOrdinalTimeAxis() {
    options.axes = [
        {
            type: 'ordinal-time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
        },
    ];
    chart.update(options);
}
