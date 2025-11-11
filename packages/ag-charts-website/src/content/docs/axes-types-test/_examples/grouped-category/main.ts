import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Total Winnings by Country & Game',
    },
    data: getData(),
    axes: {
        x: {
            type: 'grouped-category',
            position: 'bottom',
            title: {
                text: 'Axis title',
            },
            tick: {
                stroke: 'blue',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Axis title',
            },
        },
    },
    series: [
        {
            xKey: 'grouping',
            xName: 'Group',
            yKey: 'totalWinnings',
            yName: 'Total Winnings',
            showInLegend: false,
            grouped: true,
            type: 'bar',
        },
    ],
};

const chart = AgCharts.create(options);
