/* @ag-options-extract */
import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
    TimeAxisModule,
} from 'ag-charts-community';

import { getLargeScaleData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ScatterSeriesModule,
    TimeAxisModule,
]);

(window as any).agChartsDebug = 'scene:stats';

const size = 100_000;
const highlightTheme = {
    series: {
        highlight: {
            unhighlightedSeries: {
                opacity: 0.2,
            },
        },
    },
};

const visibleCount = 1;
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            line: highlightTheme,
            scatter: highlightTheme,
            area: highlightTheme,
            bar: highlightTheme,
        },
    },
    axes: {
        y: { type: 'number', position: 'left' },
        x: { type: 'time', position: 'bottom' },
    },
    data: getLargeScaleData(size),
    series: [
        {
            type: 'scatter',
            xKey: 'time',
            yKey: 'value',
            title: 'Scatter',
            shape: 'circle',
            visible: visibleCount >= 1,
            // disable high performance optimisations
            maxRenderedItems: 1_000_000,
        },
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            title: 'Line',
            marker: { enabled: true },
            visible: visibleCount >= 2,
        },
        // Disabled to allow retrospective execution for b9.1.1
        // {
        //     type: 'area',
        //     xKey: 'time',
        //     yKey: 'value',
        //     yName: 'Area',
        //     marker: { enabled: true },
        //     visible: visibleCount >= 3,
        // },
        {
            type: 'bar',
            xKey: 'time',
            yKey: 'value',
            yName: 'bar',
            visible: visibleCount >= 4,
        },
    ],
};
/* @ag-options-end */

const start = performance.now();
const chart = AgCharts.create(options);

chart.waitForUpdate().then(() => {
    console.log('Total update time: ', performance.now() - start);
});
