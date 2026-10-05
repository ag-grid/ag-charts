import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Fuel Spending (2019)',
    },
    data: getData(),
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
            title: 'Petrol',
            marker: {
                shape: 'square',
                size: 12,
                shadow: {
                    enabled: true,
                },
            },
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
            title: 'Diesel',
            marker: {
                shape: 'diamond',
                size: 14,
                shadow: {
                    enabled: true,
                    xOffset: 0,
                    yOffset: 4,
                    blur: 8,
                },
            },
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'electric',
            title: 'Electric',
            marker: {
                size: 12,
            },
        },
    ],
};

AgCharts.create(options);
