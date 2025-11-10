import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `World Population`,
    },
    series: [
        {
            type: 'line',
            yKey: 'population',
            xKey: 'year',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
            crosshair: {
                enabled: true,
            },
        },
        x: {
            type: 'category',
            position: 'bottom',
            crosshair: {
                enabled: true,
            },
        },
    },
    tooltip: {
        enabled: false,
    },
    formatter: {
        y: ({ value }) => {
            return `${Number(value).toLocaleString('en-GB', {
                notation: 'compact',
                maximumFractionDigits: 1,
            })}`;
        },
    },
};

AgCharts.create(options);
