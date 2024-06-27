import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `United Kingdom Population`,
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
                snap: false,
            },
        },
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Year',
            },
            crosshair: {
                snap: false,
            },
        },
    ],
    tooltip: {
        enabled: false,
    },
};

AgCharts.create(options);
