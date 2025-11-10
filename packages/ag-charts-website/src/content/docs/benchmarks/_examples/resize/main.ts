/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Apple's Revenue by Product Category",
    },
    subtitle: {
        text: 'In Billion U.S. Dollars',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: {
            type: 'number',
            position: 'left',
            interval: {
                maxSpacing: 10,
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
