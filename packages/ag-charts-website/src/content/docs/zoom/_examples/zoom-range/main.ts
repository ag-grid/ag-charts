import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    zoom: {
        enabled: true,
        rangeX: {
            start: new Date('2024-01-01'),
            end: new Date('2024-12-30 23:59:59'),
        },
    },
    tooltip: {
        enabled: false,
    },
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            label: {
                autoRotate: false,
            },
            tick: {
                minSpacing: 50,
                maxSpacing: 200,
            },
        },
    ],
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'price',
        },
    ],
};

const chart = AgCharts.create(options);

function changeRangeWeek() {
    options.zoom!.rangeX = {
        start: new Date('2024-12-24'),
        end: undefined,
    };
    AgCharts.update(chart, options);
}

function changeRangeMonth() {
    options.zoom!.rangeX = {
        start: new Date('2024-12-01'),
        end: new Date('2024-12-30 23:59:59'),
    };
    AgCharts.update(chart, options);
}

function changeRangeAugust() {
    options.zoom!.rangeX = {
        start: new Date('2024-08-01'),
        end: new Date('2024-08-30 23:59:59'),
    };
    AgCharts.update(chart, options);
}

function changeRangeAll() {
    options.zoom!.rangeX = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-30 23:59:59'),
    };
    AgCharts.update(chart, options);
}
