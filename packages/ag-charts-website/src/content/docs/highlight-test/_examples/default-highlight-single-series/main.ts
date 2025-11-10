// @ag-skip-fws
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Default Highlight Single Series',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'visitors',
            label: {
                enabled: true,
                color: 'black',
            },
            stroke: 'lime',
            strokeWidth: 4,
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Year',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total Visitors',
            },
        },
    },
    formatter: {
        y(params) {
            let value = params.value as number;
            value /= 1000_000;
            return `${Math.floor(value)}M`;
        },
    },
};

AgCharts.create(options);
