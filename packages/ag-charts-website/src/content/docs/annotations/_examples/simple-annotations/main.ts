import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AnnotationsModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnnotationsModule,
    CategoryAxisModule,
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
            label: {
                enabled: true,
            },
        },
    ],
    annotations: {
        enabled: true,
    },
    initialState: {
        annotations: [
            {
                type: 'comment',
                x: { value: 'May', groupPercentage: 0.2 },
                y: 98,
                text: 'Sales increased\nsignificantly\nin May',
                fontSize: 12,
            },
            {
                type: 'vertical-line',
                value: 'May',
                lineStyle: 'dotted',
            },
            {
                type: 'vertical-line',
                value: 'Sep',
                lineStyle: 'dotted',
            },
            {
                type: 'callout',
                start: {
                    x: { value: 'Sep', groupPercentage: 0.1 },
                    y: 80,
                },
                end: {
                    x: { value: 'Sep', groupPercentage: 0.5 },
                    y: 55,
                },
                text: 'End of summer\ndip recovered',
                fontSize: 12,
            },
            {
                type: 'horizontal-line',
                value: 72,
                axisLabel: {
                    fillOpacity: 0.5,
                },
                lineStyle: 'dotted',
            },
            {
                type: 'line',
                start: { x: 'Jan', y: 32 },
                end: { x: 'Dec', y: 105 },
            },
            {
                type: 'parallel-channel',
                height: 13,
                start: {
                    x: {
                        value: 'Mar',
                        groupPercentage: 0.08,
                    },
                    y: 44.7,
                },
                end: {
                    x: {
                        value: 'Jun',
                        groupPercentage: -0.08,
                    },
                    y: 86.2,
                },
                strokeOpacity: 0,
            },
            {
                type: 'parallel-channel',
                height: 13,
                start: {
                    x: {
                        value: 'Aug',
                        groupPercentage: 0.08,
                    },
                    y: 78.7,
                },
                end: {
                    x: {
                        value: 'Oct',
                        groupPercentage: -0.08,
                    },
                    y: 101.5,
                },
                strokeOpacity: 0,
            },
        ],
    },
};

AgCharts.create(options);
