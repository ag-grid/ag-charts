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
            xName: 'Wight',
            yKey: 'height',
            yName: 'Height',
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
                        text: 'Height',
                        position: 'inside-top-left',
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
                        text: 'Weight',
                        position: 'inside-bottom-right',
                    },
                },
            ],
        },
    ],
    formatter: {
        x: '#{.0f} lbs',
        y(params) {
            const value = params.value as number;
            return `${Math.floor(value / 12)}' ${Math.floor(value % 12)}"`;
        },
    },
};

AgCharts.create(options);
