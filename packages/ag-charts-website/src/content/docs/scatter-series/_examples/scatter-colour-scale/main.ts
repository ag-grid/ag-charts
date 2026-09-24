import {
    AgCartesianChartOptions,
    AgCharts,
    GradientLegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([GradientLegendModule, NumberAxisModule, ScatterSeriesModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Residential Property Prices',
    },
    subtitle: {
        text: 'By floor area and distance from the city centre',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'area',
            xName: 'Floor area',
            yKey: 'price',
            yName: 'Price',
            colorKey: 'distance',
            colorName: 'Distance from centre',
            colorScale: {
                fills: [
                    { color: '#4F8A5B', stop: 2 },
                    { color: '#D9A14B', stop: 8 },
                    { color: '#B5432B', stop: 14 },
                ],
            },
            strokeWidth: 0,
            fillOpacity: 0.9,
            size: 8,
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: {
                text: 'Floor Area',
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Price',
            },
        },
    },
    gradientLegend: {
        position: {
            placement: 'right',
            yOffset: -25,
        },
        gradient: {
            preferredLength: 200,
        },
        scale: {
            padding: 6,
            interval: {
                step: 4,
            },
        },
    },
    formatter: {
        x: '#{~f}m²',
        y: '£#{~f}k',
        color: '#{~f}km',
    },
};

AgCharts.create(options);
