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

import { getData, getVeteranData } from './data';

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
    theme: 'ag-accessible',
    title: {
        text: 'Race demographics',
    },
    series: [
        {
            type: 'histogram',
            data: getData(),
            xKey: 'age',
            xName: 'Participant Age',
            yName: 'Open',
        },
        {
            type: 'histogram',
            data: getVeteranData(),
            xKey: 'age',
            xName: 'Participant Age',
            yName: 'Veteran',
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: { text: 'Age band (years)' },
            interval: { step: 2 },
        },
        y: {
            type: 'number',
            title: { text: 'Number of participants' },
        },
    },
};

AgCharts.create(options);
