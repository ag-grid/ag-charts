// @ag-skip-fws
import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

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
            fill: {
                type: 'pattern',
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            title: {
                text: 'Year',
            },
        },
        y: {
            type: 'number',
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
