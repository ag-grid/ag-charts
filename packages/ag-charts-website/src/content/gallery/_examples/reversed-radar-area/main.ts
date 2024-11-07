import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Efficiency KPI',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
            fillOpacity: 0.2,
        },
    ],
    axes: [
        {
            type: 'angle-category',
            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
            label: {
                padding: 5,
            },
        },
        {
            type: 'radius-number',
            shape: 'circle',
            positionAngle: 180,
            label: {
                rotation: 180,
            },
            reverse: true,
        },
    ],
};

AgCharts.create(options);
