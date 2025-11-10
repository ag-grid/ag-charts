import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

// Calculate statistics for reference lines
const data = getData();
const engineSizes = data.map((d) => d['engine-size']);
const mean = engineSizes.reduce((a, b) => a + b, 0) / engineSizes.length;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    title: {
        text: 'Vehicle Engine Size Distribution',
        spacing: 25,
    },
    footnote: {
        text: `Source: UCI Machine Learning Repository • Sample Size: ${data.length} vehicles • USA 1987`,
    },
    series: [
        {
            type: 'histogram',
            xKey: 'engine-size',
            xName: 'Engine Size',
            stroke: 'transparent',
            strokeWidth: 2,
            cornerRadius: 4,
            tooltip: {
                renderer: (params) => {
                    const { datum } = params;
                    const binStart = Math.round(datum.domain[0]);
                    const binEnd = Math.round(datum.domain[1]);
                    const percentage = ((datum.frequency / data.length) * 100).toFixed(1);

                    return {
                        data: [
                            { label: 'Engine Size Range', value: `${binStart} - ${binEnd} cu in` },
                            { label: 'Vehicle Count', value: String(datum.frequency) },
                            { label: 'Percentage', value: `${percentage}%` },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            nice: false,
            title: {
                text: 'Engine Size (Cubic Inches)',
            },
            crossLines: [
                {
                    type: 'line',
                    value: mean,
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        text: `Mean: ${Math.round(mean)} cu in`,
                    },
                },
            ],
            crosshair: {
                enabled: false,
            },
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Number of Vehicles',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    },
};

AgCharts.create(options);
