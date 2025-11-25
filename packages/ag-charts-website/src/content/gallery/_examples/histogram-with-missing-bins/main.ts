import { HistogramSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([HistogramSeriesModule, NumberAxisModule]);
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
            fillOpacity: 0.7,
            strokeWidth: 1,
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
                        data: [{ label: 'Frequency', value: `${meanValue.toFixed(1)} vehicles` }],
                    };
                },
            },
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                },
            },
        },
    ],
    axes: {
        x: {
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
            crossLines: [
                {
                    type: 'line',
                    value: 200,
                    lineDash: [6, 3],
                    strokeOpacity: 0.4,
                    label: {
                        text: 'Large Engines',
                        fontStyle: 'italic',
                        position: 'inside-bottom-right',
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
    },
    tooltip: {
        position: {
            xOffset: 20,
            yOffset: 20,
        },
    },
};

AgCharts.create(options);
