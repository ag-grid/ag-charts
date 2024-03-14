import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Vehicle Fuel Efficiency',
        fontSize: 18,
    },
    subtitle: {
        text: 'USA 1987',
    },
    footnote: {
        text: 'Source: UCI',
    },
    series: [
        {
            type: 'histogram',
            xKey: 'engine-size',
            xName: 'Engine Size',
            yKey: 'highway-mpg',
            yName: 'Highway MPG',
            aggregation: 'mean',
            cornerRadius: 6,
            fillOpacity: 0.7,
            label: {
                formatter: ({ value }) => value.toFixed(0),
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            gridLine: {
                enabled: false,
            },
            title: {
                enabled: true,
                text: 'Engine Size (Cubic Inches)',
            },
        },
        {
            position: 'left',
            type: 'number',
            reverse: true,
            title: {
                text: 'Highway MPG',
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
