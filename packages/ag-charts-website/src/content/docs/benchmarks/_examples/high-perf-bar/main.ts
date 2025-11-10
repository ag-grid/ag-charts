/* @ag-options-extract */
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats:verbose';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: { enabled: false },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        minVisibleItems: 0,
    },
    navigator: {
        enabled: true,
    },
    series: [
        {
            type: 'bar',
            xKey: 'timestamp',
            yKey: 'price',
        },
    ],
    axes: {
        y: { type: 'number', position: 'left' },
        x: { type: 'unit-time', position: 'bottom' },
    },
};
/* @ag-options-end */

const start = performance.now();
const chart = AgCharts.create(options);

chart.waitForUpdate().then(() => {
    console.log('Total update time: ', performance.now() - start);
});
