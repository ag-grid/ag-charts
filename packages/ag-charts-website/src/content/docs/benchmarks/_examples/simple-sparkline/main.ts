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

const start = performance.now();
const chart = AgCharts.__createSparkline(options);

chart.waitForUpdate().then(() => {
    console.log('Total update time: ', performance.now() - start);
});
