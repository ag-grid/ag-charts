import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    CandlestickSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CandlestickSeriesModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
    subtitle: {
        text: 'Candlestick Patterns',
    },
    footnote: {
        text: '1 Minute',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Time',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
            item: {
                up: {
                    fill: 'transparent',
                    stroke: '#2b5c95',
                    wick: {
                        strokeWidth: 2,
                    },
                },
                down: {
                    fill: '#5090dc',
                    stroke: '#2b5c95',
                    wick: {
                        strokeWidth: 2,
                    },
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            label: {
                format: '%H:%M',
            },
        },
        y: {
            type: 'number',
            position: 'right',
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
            crosshair: {
                label: {
                    format: ',f',
                },
            },
        },
    },
};

AgCharts.create(options);
