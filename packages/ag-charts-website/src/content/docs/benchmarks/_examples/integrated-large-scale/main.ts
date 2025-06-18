/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

import { integratedChartOptions } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    ...integratedChartOptions,
    container: document.getElementById('myChart'),
};
/* @ag-options-end */

const start = performance.now();
const chart = AgCharts.create(options);

chart.waitForUpdate().then(() => {
    console.log('Total update time: ', performance.now() - start);
});
