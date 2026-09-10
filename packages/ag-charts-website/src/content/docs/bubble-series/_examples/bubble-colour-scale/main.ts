import {
    AgCartesianChartOptions,
    AgCharts,
    BubbleSeriesModule,
    GradientLegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, GradientLegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Product Portfolio',
    },
    subtitle: {
        text: 'Bubble size shows annual revenue, colour shows profit margin',
    },
    series: [
        {
            type: 'bubble',
            xKey: 'marketShare',
            xName: 'Market Share',
            yKey: 'growth',
            yName: 'Revenue Growth',
            sizeKey: 'revenue',
            sizeName: 'Revenue',
            colorKey: 'margin',
            colorName: 'Profit Margin',
            fillOpacity: 0.9,
            colorScale: {
                fills: [{ color: '#dd3497' }, { color: '#1d91c0' }],
            },
            strokeWidth: 0,
            minSize: 8,
            maxSize: 40,
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: {
                text: 'Market Share',
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Revenue Growth',
            },
        },
    },
    gradientLegend: {
        position: {
            placement: 'right',
            yOffset: -55,
        },
        gradient: {
            preferredLength: 240,
        },
        scale: {
            padding: 6,
            interval: {
                step: 5,
            },
        },
    },
    formatter: {
        x: '#{~f}%',
        y: '#{~f}%',
        size: '$#{,.0f}m',
        color: '#{~f}%',
    },
};

AgCharts.create(options);
