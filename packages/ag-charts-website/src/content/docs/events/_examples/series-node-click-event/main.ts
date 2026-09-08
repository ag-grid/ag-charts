import {
    AgCartesianChartOptions,
    AgCharts,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    RangeBarSeriesModule,
} from 'ag-charts-enterprise';

import type { DataType } from './data';
import { getData } from './data';

ModuleRegistry.registerModules([
    RangeBarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
]);

function toString(ev: { datum: DataType; seriesId: string }) {
    const celsius = new Intl.NumberFormat('en-US', { style: 'unit', unit: 'celsius', unitDisplay: 'short' });
    const mean = celsius.format(ev.datum.mean);
    const low = celsius.format(ev.datum.low);
    const high = celsius.format(ev.datum.high);
    return `${ev.seriesId}, mean: ${mean}, low: ${low}, high: ${high}`;
}

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'London Monthly Temperatures',
    },
    subtitle: {
        text: 'Year-on-year average temperature with this year’s high/low range',
    },
    data: getData(),
    legend: {
        enabled: true,
    },
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Month',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Temperature (°C)',
            },
            label: {
                formatter: ({ value }) => `${value}°C`,
            },
        },
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'month',
            yLowKey: 'low',
            yHighKey: 'high',
            yName: 'This year high/low',
            listeners: {
                seriesNodeClick: (ev) => console.log('[bar click]', toString(ev)),
                seriesNodeDoubleClick: (ev) => console.log('[bar double click]', toString(ev)),
            },
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'mean',
            yName: 'Year-on-year average',
            listeners: {
                seriesNodeClick: (ev) => console.log('[line click]', toString(ev)),
                seriesNodeDoubleClick: (ev) => console.log('[line double click]', toString(ev)),
            },
        },
    ],
    listeners: {
        seriesNodeClick: (ev) => console.log('[chart click]', toString(ev)),
        seriesNodeDoubleClick: (ev) => console.log('[chart double click]', toString(ev)),
    },
};

AgCharts.create(options);
