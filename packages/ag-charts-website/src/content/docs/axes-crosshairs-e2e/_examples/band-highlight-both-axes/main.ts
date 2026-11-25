import type { AgCartesianChartOptions } from 'ag-charts-enterprise';
import {
    AgCharts,
    BandHighlightModule,
    BubbleSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BandHighlightModule, BubbleSeriesModule, CategoryAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Commits by Day and Time',
    },
    series: [
        {
            type: 'bubble',
            xKey: 'day',
            xName: 'Day',
            yKey: 'slot',
            yName: 'Time',
            sizeKey: 'commits',
            sizeName: 'Commits',
        },
    ],
    axes: {
        x: {
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
        y: {
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
    },
};

AgCharts.create(options);
