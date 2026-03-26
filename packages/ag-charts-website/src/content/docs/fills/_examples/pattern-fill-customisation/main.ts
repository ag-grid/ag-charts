import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BubbleSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    seriesArea: {
        padding: {
            right: 30,
            top: 30,
        },
    },
    series: [
        {
            type: 'bubble',
            xKey: 'weight',
            xName: 'Weight',
            yKey: 'lifespan',
            yName: 'lifespan',
            sizeKey: 'weight',
            sizeName: 'Weight',
            labelKey: 'animal',
            fill: {
                type: 'pattern',
                pattern: 'stars',
                fill: '#6A4C93',
                backgroundFill: '#B8A0D2',
                backgroundFillOpacity: 0.5,
                stroke: 'white',
                strokeWidth: 1,
            },
            maxSize: 70,
        },
    ],
};

AgCharts.create(options);
