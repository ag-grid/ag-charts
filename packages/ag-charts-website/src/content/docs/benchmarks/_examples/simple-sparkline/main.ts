/* @ag-options-extract */
import { AgCharts, AgSparklineOptions } from 'ag-charts-community';

import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    background: {
        visible: false,
    },
    minHeight: 0,
    minWidth: 0,
    type: 'line',
    theme: {
        overrides: {
            line: {
                series: {
                    stroke: 'rgb(124, 255, 178)',
                    strokeWidth: 2,
                },
            },
        },
    },
    data: getData(),
    xKey: 'x',
    yKey: 'y',
    width: 708,
    height: 47,
};
/* @ag-options-end */

async function main() {
    const start = performance.now();

    const count = 500;
    let chart, previousChart;
    for (let i = 0; i < count; i++) {
        previousChart = chart;
        chart = AgCharts.__createSparkline(options);

        await chart.waitForUpdate();
        previousChart?.destroy();
    }
    const duration = performance.now() - start;
    console.log('Total update time: ', duration);
    console.log('Average update time: ', duration / count);
}

main().catch((e) => console.error(e));
