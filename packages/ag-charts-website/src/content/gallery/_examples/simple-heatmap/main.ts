import { CategoryAxisModule, ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, GradientLegendModule, HeatmapSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, HeatmapSeriesModule]);
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
            strokeWidth: 0.5,
            strokeOpacity: 0.1,
        },
    ],
    axes: {
        y: {
            type: 'category',
            position: 'left',
            line: {
                enabled: false,
            },
        },
        x: {
            type: 'category',
            position: 'bottom',
            label: {
                autoRotate: false,
            },
            line: {
                enabled: false,
            },
        },
    },
    gradientLegend: {
        enabled: true,
        gradient: {
            thickness: 15,
            preferredLength: 400,
        },
    },
};

AgCharts.create(options);
