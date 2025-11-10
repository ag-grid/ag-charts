import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Global Temperature Patterns by Continent',
        spacing: 8,
    },
    subtitle: {
        text: 'Monthly temperature ranges (2020) showing seasonal variations across regions',
        spacing: 16,
    },
    footnote: {
        text: 'Data: World Meteorological Organization. Ranges show typical monthly lows and highs.',
        fontStyle: 'italic',
        spacing: 12,
    },
    series: Object.entries(data).map(([continent, temperatures]) => {
        return {
            data: temperatures,
            type: 'range-bar',
            xKey: 'month',
            xName: 'Month',
            yName: continent,
            yLowKey: 'lowTemperature',
            yHighKey: 'highTemperature',
            yLowName: 'Min Temp',
            yHighName: 'Max Temp',
            cornerRadius: 3,
            strokeWidth: 0,
            fillOpacity: 0.85,
            highlight: {
                highlightedItem: {
                    strokeWidth: 2,
                },
                highlightedSeries: {
                    fillOpacity: 0.3,
                    strokeWidth: 1,
                },
                unhighlightedSeries: {
                    fillOpacity: 0.3,
                },
            },
        };
    }),
    tooltip: {
        mode: 'shared',
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            paddingInner: 0.5,
            groupPaddingInner: 0.05,
            bandHighlight: {
                enabled: true,
            },
            label: {
                formatter: ({ value }) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { month: 'short' });
                },
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            line: {
                enabled: false,
            },
            tick: {
                size: 6,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                    },
                    {
                        strokeWidth: 0.5,
                        lineDash: [3, 2],
                    },
                ],
            },
            label: {
                formatter: ({ value }) => `${value}°C`,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 42,
                    stroke: '#ef4444',
                    lineDash: [6, 3],
                    strokeOpacity: 0.5,
                    strokeWidth: 2,
                    label: {
                        text: 'Extreme Heat\n(42°C)',
                        position: 'right',
                        padding: 8,
                    },
                },
                {
                    type: 'line',
                    value: 5,
                    stroke: '#3b82f6',
                    lineDash: [6, 3],
                    strokeOpacity: 0.5,
                    strokeWidth: 2,
                    label: {
                        text: 'Near Freezing\n(5°C)',
                        position: 'right',
                        padding: 8,
                    },
                },
                {
                    type: 'range',
                    range: [20, 30],
                    fill: '#10b981',
                    fillOpacity: 0.03,
                    stroke: '#10b981',
                    strokeWidth: 0,
                    label: {
                        text: 'Optimal\nComfort Zone',
                        position: 'right',
                        padding: 8,
                    },
                },
            ],
        },
    },
    legend: {
        spacing: 40,
        item: {
            paddingX: 16,
            paddingY: 8,
            marker: {
                size: 18,
            },
        },
    },
};

AgCharts.create(options);
