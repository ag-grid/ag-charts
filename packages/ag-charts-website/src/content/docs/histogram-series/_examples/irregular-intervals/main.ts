import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    HistogramSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    HistogramSeriesModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Race demographics',
    },
    subtitle: {
        text: 'Number of participants by age category',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            xKey: 'age',
            xName: 'Participant Age',
            areaPlot: true,
            bins: [
                [16, 18],
                [18, 21],
                [21, 25],
                [25, 40],
            ],
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: { text: 'Age category (years)' },
            interval: { step: 2 },
        },
        y: {
            type: 'number',
            title: { text: 'Number of participants' },
        },
    },
};

AgCharts.create(options);
