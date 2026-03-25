import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    AnnotationsModule,
    CategoryAxisModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AnnotationsModule,
    CategoryAxisModule,
    ChartToolbarModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ContextMenuModule,
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
    annotations: {
        enabled: true,
        toolbar: {
            buttons: [
                {
                    icon: 'trend-line-drawing',
                    value: 'line-menu',
                },
                {
                    icon: 'trend-line-drawing',
                    value: 'line',
                },
                {
                    icon: 'parallel-channel-drawing',
                    value: 'parallel-channel',
                },
                {
                    icon: 'delete',
                    value: 'clear',
                },
            ],
        },
    },
};

AgCharts.create(options);
