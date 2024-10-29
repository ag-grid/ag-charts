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
    },
    navigator: {
        enabled: true,
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'volume',
            yName: 'Volume',
            marker: { enabled: false },
        },
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'price',
            marker: { enabled: false },
        },
    ],
    axes: [
        { type: 'number', keys: ['price'], position: 'left' },
        { type: 'time', nice: false, position: 'bottom' },
        { type: 'number', keys: ['volume'], position: 'right' },
    ],
};

AgCharts.create(options);
