import {
    AgChartOptions,
    AgCharts,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    RangesModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    RangesModule,
    ZoomModule,
    NavigatorModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'value',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            label: {
                autoRotate: false,
            },
        },
        y: {
            type: 'number',
        },
    },
    ranges: {
        buttons: [
            {
                label: 'Last 1M',
                value: (_start, _end, _windowStart, windowEnd) => {
                    const month = 30 * 24 * 60 * 60 * 1000;
                    return [Number(windowEnd) - month, windowEnd];
                },
            },
            {
                label: 'Last 3M',
                value: (_start, _end, _windowStart, windowEnd) => {
                    const months = 3 * 30 * 24 * 60 * 60 * 1000;
                    return [Number(windowEnd) - months, windowEnd];
                },
            },
            {
                label: '1M Centre',
                value: (_start, _end, windowStart, windowEnd) => {
                    const mid = (Number(windowStart) + Number(windowEnd)) / 2;
                    const halfMonth = (30 * 24 * 60 * 60 * 1000) / 2;
                    return [mid - halfMonth, mid + halfMonth];
                },
            },
            {
                label: '3M Centre',
                value: (_start, _end, windowStart, windowEnd) => {
                    const mid = (Number(windowStart) + Number(windowEnd)) / 2;
                    const halfRange = (3 * 30 * 24 * 60 * 60 * 1000) / 2;
                    return [mid - halfRange, mid + halfRange];
                },
            },
            {
                label: '< 1M',
                value: (_start, _end, windowStart, windowEnd) => {
                    const month = 30 * 24 * 60 * 60 * 1000;
                    return [Number(windowStart) - month, Number(windowEnd) - month];
                },
            },
            {
                label: '1M >',
                value: (_start, _end, windowStart, windowEnd) => {
                    const month = 30 * 24 * 60 * 60 * 1000;
                    return [Number(windowStart) + month, Number(windowEnd) + month];
                },
            },
            { label: 'All', value: undefined },
        ],
    },
    zoom: { enabled: true },
    navigator: { enabled: true },
};

const chart = AgCharts.create(options);
