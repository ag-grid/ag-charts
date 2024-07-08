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
            yKey: 'population',
            xKey: 'year',
            stroke: '#6769EB',
            marker: {
                fill: '#6769EB',
                stroke: '#6769EB',
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value }) => {
                    return `${Number(value).toLocaleString('en-GB', {
                        notation: 'compact',
                        maximumFractionDigits: 1,
                    })}`;
                },
            },
            crosshair: {
                enabled: true,
            },
        },
        {
            type: 'category',
            position: 'bottom',
            crosshair: {
                enabled: true,
            },
        },
    ],
    tooltip: {
        enabled: false,
    },
};

AgCharts.create(options);
