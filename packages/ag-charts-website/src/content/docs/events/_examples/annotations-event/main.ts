import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AnnotationsModule, ChartToolbarModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnnotationsModule,
    CategoryAxisModule,
    ChartToolbarModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Sales Revenue',
    },
    footnote: {
        text: '2024, values in $1000s',
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'revenue',
            interpolation: { type: 'smooth' },
            marker: {
                enabled: false,
            },
        },
    ],
    listeners: {
        annotations: (event) => {
            console.log(event);
        },
    },
    annotations: {
        enabled: true,
        toolbar: {
            buttons: [
                {
                    icon: 'delete',
                    value: 'clear',
                },
                {
                    icon: 'text-annotation',
                    value: 'text-menu',
                },
            ],
        },
    },
    initialState: {
        annotations: [
            {
                type: 'comment',
                x: { value: 'Feb', groupPercentage: -0.2 },
                y: 46,
                text: '$45,000',
                fontSize: 12,
            },
            {
                type: 'text',
                x: { value: 'Jun', groupPercentage: -0.2 },
                y: 81,
                text: '$80,000',
                fontSize: 12,
            },
            {
                type: 'note',
                x: 'Sep',
                y: 75,
                text: 'End of summer dip recovered',
                fontSize: 12,
            },
            {
                type: 'callout',
                start: { x: { value: 'Dec', groupPercentage: -0.1 }, y: 107 },
                end: { x: 'Oct', y: 110 },
                text: '$95,000',
                fontSize: 12,
            },
        ],
    },
};

AgCharts.create(options);
