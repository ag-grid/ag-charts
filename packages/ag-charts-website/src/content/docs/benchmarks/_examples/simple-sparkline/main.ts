// @ag-skip-fws
// @ag-skip-container-check
/* @ag-options-extract */
import { AgCharts, type AgSparklineOptions, VERSION } from 'ag-charts-community';
import { AgChartInstance } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    background: {
        visible: false,
    },
    minHeight: 0,
    minWidth: 0,
    type: 'line',
    theme: {
        overrides: {
            line: {
                series: {
                    stroke: 'rgb(124, 255, 178)',
                    strokeWidth: 2,
                },
            },
        },
    },
    data: getData(),
    xKey: 'x',
    yKey: 'y',
    width: 708,
    height: 47,
};
/* @ag-options-end */

const chart = AgCharts.__createSparkline(options);

const charts: AgChartInstance<AgSparklineOptions>[] = [];
/** inScope */
async function performSingleCreation(): Promise<number> {
    const container = document.getElementById('myChart');
    if (!container) return 0;

    const start = performance.now();

    charts.push(
        AgCharts.__createSparkline({
            ...options,
            container,
        })
    );
    await charts.at(-1)!.waitForUpdate();

    return performance.now() - start;
}

/** inScope */
async function performPooledCreation(): Promise<number> {
    const start = performance.now();

    const newChart = AgCharts.__createSparkline({
        ...options,
        container: document.createElement('div'),
    });
    await newChart.waitForUpdate();

    const result = performance.now() - start;
    newChart.destroy();
    return result;
}

/** inScope */
async function performDataUpdate(): Promise<number> {
    const newData = getData().map((d) => ({ ...d, y: d.y * (0.8 + Math.random() * 0.4) }));

    const start = performance.now();
    await chart.update({ ...options, data: newData });
    await chart.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
async function performDeltaUpdate(): Promise<number> {
    const newData = getData().map((d) => ({ ...d, y: d.y * (0.8 + Math.random() * 0.4) }));

    const start = performance.now();
    await chart.updateDelta({ data: newData });
    await chart.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'cold-creation',
                label: 'Cold Creation',
                variants: [
                    {
                        params: { Operation: 'Create Sparkline' },
                        run: performSingleCreation,
                    },
                ],
                teardown: () => {
                    charts.forEach((chart) => chart.destroy());
                    charts.length = 0;
                },
            },
            {
                id: 'pooled-creation',
                label: 'Warm Creation',
                variants: [
                    {
                        params: { Operation: 'Create Sparkline' },
                        run: performPooledCreation,
                    },
                ],
            },
            {
                id: 'data-update',
                label: 'Data Update',
                variants: [
                    {
                        params: { Operation: 'Full Update' },
                        run: performDataUpdate,
                    },
                ],
            },
            {
                id: 'delta-update',
                label: 'Delta Update',
                variants: [
                    {
                        params: { Operation: 'Delta Update' },
                        run: performDeltaUpdate,
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 100,
            maxCollectionTimeMs: 10000,
            warmupUpdates: 10,
        },
        metadata: {
            dataPoints: getData().length,
            seriesCount: 1,
            version: VERSION,
            expectedRetainedSizeMB: 2,
            expectedCanvasCount: 3,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
