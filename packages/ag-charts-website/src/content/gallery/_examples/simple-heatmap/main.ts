import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Monthly Mean Temperature',
    },
    subtitle: {
        text: '2010-2022 Climate Data',
    },
    formatter: {
        color: ({ value }) => {
            return `${(value as number).toFixed(0)}°C`;
        },
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'month',
            xName: 'Month',
            yKey: 'year',
            yName: 'Year',
            colorKey: 'temperature',
            colorName: 'Temperature',

            // Enhanced color scale - diverging blue to red
            colorRange: [
                'darkblue',
                'blue',
                'lightblue',
                'lightyellow',
                'yellow',
                'orange',
                'darkorange',
                'red',
                'darkred',
            ],

            // Enhanced tooltip
            tooltip: {
                renderer: ({ datum, xKey, yKey, colorKey }) => {
                    const temp = colorKey ? datum[colorKey] : 0;
                    const tempClass = temp < 5 ? 'Cold' : temp > 15 ? 'Warm' : 'Moderate';
                    return {
                        title: `${datum[xKey]} ${datum[yKey]}`,
                        data: [
                            { label: 'Temperature', value: `${temp.toFixed(1)}°C` },
                            { label: 'Classification', value: tempClass },
                        ],
                    };
                },
            },

            // Cell styling
            itemPadding: 1,
            strokeWidth: 0.5,
            strokeOpacity: 0.1,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                rotation: 0,
            },
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        position: 'bottom',
        gradient: {
            thickness: 15,
            preferredLength: 400,
        },
    },
    theme: {
        overrides: {
            heatmap: {
                series: {
                    highlight: {
                        highlightedItem: {
                            strokeWidth: 2,
                        },
                    },
                },
            },
        },
    },
};

AgCharts.create(options);
