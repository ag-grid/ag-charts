/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

import { integratedChartOptions } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    ...integratedChartOptions,
    container: document.getElementById('myChart'),
};
/* @ag-options-end */

var chart = AgCharts.create(options);
