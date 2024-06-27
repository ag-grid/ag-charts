import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Height vs Weight for Major League Baseball Players',
    },
    footnote: {
        text: 'Source: Statistics Online Computational Resource',
        spacing: 35,
    },
    padding: {
        left: 35,
    },
    series: [
        {
            type: 'scatter',
            xKey: 'weight',
            yKey: 'height',
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
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 210,
                    lineDash: [5, 4],
                    label: {
                        text: 'Height (Inches)',
                        position: 'topLeft',
                    },
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            nice: false,
            gridLine: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 75,
                    lineDash: [5, 4],
                    label: {
                        text: 'Weight (Pounds)',
                        position: 'insideTopRight',
                    },
                },
            ],
        },
    ],
};

AgCharts.create(options);
