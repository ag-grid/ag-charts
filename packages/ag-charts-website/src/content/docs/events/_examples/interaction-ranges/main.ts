import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { DataType } from './data';

let options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: [
        {
            quarter: 'Q1',
            petrol: 200,
            diesel: 100,
        },
        {
            quarter: 'Q2',
            petrol: 300,
            diesel: 130,
        },
        {
            quarter: 'Q3',
            petrol: 350,
            diesel: 160,
        },
        {
            quarter: 'Q4',
            petrol: 400,
            diesel: 200,
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
            nodeClickRange: 'exact',
            listeners: {
                seriesNodeClick: ({ datum }) => console.log(`petrol - ${datum.petrol}`),
            },
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
            nodeClickRange: 'exact',
            listeners: {
                seriesNodeClick: ({ datum }) => console.log(`diesel - ${datum.diesel}`),
            },
        },
    ],
    axes: [
        { type: 'category', position: 'bottom' },
        { type: 'number', position: 'left' },
    ],
};

const chart = AgCharts.create(options);

function exact() {
    options.series = options.series!.map((series) => ({
        ...series,
        nodeClickRange: 'exact',
    }));

    chart.update(options);
}

function nearest() {
    options.series = options.series!.map((series) => ({
        ...series,
        nodeClickRange: 'nearest',
    }));

    chart.update(options);
}

function distance() {
    options.series = options.series!.map((series) => ({
        ...series,
        nodeClickRange: 10,
    }));

    chart.update(options);
}
