/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { integratedChartOptions } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    ...integratedChartOptions,
    container: document.getElementById('myChart'),
};
/* @ag-options-end */

async function main() {
    const start = performance.now();

    const count = 20;
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
