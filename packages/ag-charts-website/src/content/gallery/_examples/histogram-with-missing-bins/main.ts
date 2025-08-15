import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Vehicle Fuel Efficiency by Engine Size',
    },
    subtitle: {
        text: 'Average Highway MPG across Engine Displacement Categories · USA 1987',
    },
    footnote: {
        text: 'Source: UCI Machine Learning Repository',
    },
    formatter: {
        y: ({ value }) => {
            if (typeof value === 'number') {
                return `${value.toFixed(1)} mpg`;
            }
            return String(value);
        },
    },
    series: [
        {
            type: 'histogram',
            xKey: 'engine-size',
            xName: 'Engine Size',
            yKey: 'highway-mpg',
            yName: 'Highway MPG',
            aggregation: 'mean',
            cornerRadius: 8,
            fillOpacity: 0.85,
            strokeWidth: 2,
            shadow: {
                enabled: true,
                blur: 10,
                xOffset: 0,
                yOffset: 3,
            },
            label: {
                enabled: true,
                formatter: ({ value }) => value.toFixed(1),
            },
            tooltip: {
                renderer: ({ datum }) => {
                    const binStart = datum.domain[0];
                    const binEnd = datum.domain[1];
                    const meanValue = datum.frequency;

                    return {
                        title: `${binStart} - ${binEnd} in³`,
                        content: `Average MPG: ${meanValue.toFixed(1)}`,
                    };
                },
            },
            highlight: {
                highlightedItem: {
                    fillOpacity: 1,
                    strokeWidth: 3,
                },
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
                text: 'Engine Displacement (Cubic Inches)',
            },
            label: {
                formatter: ({ value }) => `${value}`,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 200,
                    strokeWidth: 1,
                    lineDash: [6, 3],
                    strokeOpacity: 0.4,
                    label: {
                        text: 'Large Engines',
                        fontStyle: 'italic',
                        padding: 5,
                        position: 'inside-bottom-right',
                    },
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            reverse: true,
            title: {
                text: 'Average Highway MPG (Better →)',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                ],
            },
            crossLines: [
                {
                    type: 'range',
                    range: [15, 25],
                    fillOpacity: 0.05,
                    label: {
                        text: 'Typical Range',
                        fontStyle: 'italic',
                        position: 'inside-bottom-right',
                    },
                },
            ],
        },
    ],
    legend: {
        enabled: false,
    },
    padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    },
    tooltip: {
        position: {
            xOffset: 20,
            yOffset: 20,
        },
    },
};

AgCharts.create(options);
