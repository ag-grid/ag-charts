// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import {
    ChartRef,
    SeriesVisibilityState,
    performDatumHighlight,
    performInitialLoad,
    performLegendToggle,
} from './benchmarkUtils';
import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Simple Chart',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'children',
            yName: 'Children',
            stacked: true,
            tooltip: {},
            marker: {},
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'adults',
            yName: 'Adults',
            stacked: true,
            tooltip: {},
            marker: {},
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
            grouped: true,
            tooltip: {},
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
            grouped: true,
            tooltip: {},
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'portions',
            yName: 'Portions',
            yKeyAxis: 'ySecondary',
            stroke: 'red',
            marker: { fill: 'red' },
            tooltip: {},
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Adults Who Eat 5 A Day (%)',
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Portions Consumed (Per Day)',
            },
        },
    },
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

// Store series visibility states
const seriesCount = options.series!.length;
const visibilityState: SeriesVisibilityState = { visible: new Array(seriesCount).fill(true) };

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: [
                    {
                        params: { Operation: 'Chart Create' },
                        run: () => performInitialLoad(options, chartRef, (opts) => AgCharts.create(opts)),
                    },
                ],
            },
            {
                id: 'legend-toggle',
                label: 'Legend Toggle',
                variants: [
                    {
                        params: { Repetitions: '1x' },
                        run: () => performLegendToggle(chartRef.current!, options, visibilityState, 2), // Toggle on/off
                    },
                    {
                        params: { Repetitions: '10x' },
                        run: () => performLegendToggle(chartRef.current!, options, visibilityState, 10),
                    },
                ],
            },
            {
                id: 'datum-highlight',
                label: 'Datum Highlight',
                variants: [
                    {
                        params: { Repetitions: '1x' },
                        run: () => performDatumHighlight(chartRef.current!, container, 1),
                    },
                    {
                        params: { Repetitions: '15x' },
                        run: () => performDatumHighlight(chartRef.current!, container, 15),
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 20,
            maxCollectionTimeMs: 10000,
            warmupUpdates: 5,
        },
        metadata: {
            dataPoints: getData().length,
            seriesCount: seriesCount,
            version: VERSION,
            expectedRetainedSizeMB: 8.5,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
