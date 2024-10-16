/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Simple Chart',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'children',
            yName: 'Children',
            stacked: true,
            tooltip: {},
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'adults',
            yName: 'Adults',
            stacked: true,
            tooltip: {},
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
            grouped: true,
            tooltip: {},
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
            grouped: true,
            tooltip: {},
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'portions',
            yName: 'Portions',
            stroke: 'red',
            marker: { fill: 'red' },
            tooltip: {},
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
            keys: ['women', 'men', 'children', 'adults'],
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['portions'],
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    ],
};
/* @ag-options-end */

const start = performance.now();
const chart = AgCharts.create(options);

chart.waitForUpdate().then(() => {
    console.log('Total update time: ', performance.now() - start);
});
