import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

import { integratedChartOptions } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    ...integratedChartOptions,
    container: document.getElementById('myChart'),
    autoSize: true,
};

var chart = AgCharts.create(options);
