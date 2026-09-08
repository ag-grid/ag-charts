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

function logClick(prefix: string, ev: { datum: DataType; seriesId?: string }): void {
    const { datum, seriesId } = ev;
    console.log(`[${prefix}] ${seriesId}, ${datum.month} `, datum);
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
                seriesNodeClick: (ev) => logClick('bar click', ev),
                seriesNodeDoubleClick: (ev) => logClick('bar double click', ev),
            },
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'mean',
            yName: 'Year-on-year average',
            listeners: {
                seriesNodeClick: (ev) => logClick('line click', ev),
                seriesNodeDoubleClick: (ev) => logClick('line double click', ev),
            },
        },
    ],
    listeners: {
        seriesNodeClick: (ev) => logClick('chart click', ev),
        seriesNodeDoubleClick: (ev) => logClick('chart double click', ev),
    },
};

AgCharts.create(options);
