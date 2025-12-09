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
            marker: {},
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'adults',
            yName: 'Adults',
            stacked: true,
            tooltip: {},
            marker: {},
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
            yKeyAxis: 'ySecondary',
            stroke: 'red',
            marker: { fill: 'red' },
            tooltip: {},
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    },
};
/* @ag-options-end */

async function main() {
    const start = performance.now();

    const count = 100;
    let chart, previousChart;
    for (let i = 0; i < count; i++) {
        previousChart = chart;
        chart = AgCharts.create(options);

        await chart.waitForUpdate();
        previousChart?.destroy();
    }
    const duration = performance.now() - start;
    console.log('Total update time: ', duration);
    console.log('Average update time: ', duration / count);
}

main().catch((e) => console.error(e));
