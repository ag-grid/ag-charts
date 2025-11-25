import { LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    AnimationModule,
    BandHighlightModule,
    OrdinalTimeAxisModule,
    RangeBarSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BandHighlightModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    RangeBarSeriesModule,
]);
const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
});

const data = getData();

// Calculate average price range for reference line
const avgRange = data.reduce((sum, d) => sum + (d.high - d.low), 0) / data.length;
const avgPrice = data.reduce((sum, d) => sum + (d.high + d.low) / 2, 0) / data.length;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'S&P 500 Index Daily Trading Range',
    },
    subtitle: {
        text: 'High-Low Price Spread (Aug-Nov 2023)',
    },
    footnote: {
        text: `Average daily range: $${avgRange.toFixed(2)}`,
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
            yLowName: 'Low',
            yHighName: 'High',
            cornerRadius: 4,
            strokeWidth: 1,
            tooltip: {
                renderer: ({ datum, xKey, yLowKey, yHighKey }) => {
                    const date = new Date(datum[xKey]);
                    const range = datum[yHighKey] - datum[yLowKey];
                    const percentRange = ((range / datum[yLowKey]) * 100).toFixed(2);

                    return {
                        heading: day.format(date),
                        title: 'Trading Data',
                        data: [
                            { label: 'High', value: `$${datum[yHighKey].toLocaleString()}` },
                            { label: 'Low', value: `$${datum[yLowKey].toLocaleString()}` },
                            { label: 'Range', value: `$${range.toFixed(2)} (${percentRange}%)` },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            position: 'bottom',
            bandHighlight: {
                enabled: true,
            },
            crosshair: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0, // Alternating bands
                    },
                ],
            },
        },
        y: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Price ($)',
            },
            label: {
                formatter: ({ value }) => `$${value.toLocaleString()}`,
            },
            nice: false,
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0, // Alternating bands
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: avgPrice,
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        text: `Avg: $${avgPrice.toFixed(0)}`,
                    },
                },
            ],
        },
    },
    animation: {
        enabled: true,
        duration: 800,
    },
};

AgCharts.create(options);
