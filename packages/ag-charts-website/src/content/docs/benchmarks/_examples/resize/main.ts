// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Apple's Revenue by Product Category",
    },
    subtitle: {
        text: 'In Billion U.S. Dollars',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
        },
    ],
    axes: {
        y: {
            type: 'number',
            interval: {
                maxSpacing: 10,
            },
        },
    },
};
/* @ag-options-end */

const chart = AgCharts.create(options);

const seriesCount = options.series!.length;

/** inScope */
async function performResize(count: number): Promise<number> {
    const container = document.getElementById('myChart');
    if (!container) return 0;

    const originalWidth = container.style.width;
    const originalHeight = container.style.height;

    const start = performance.now();

    for (let i = 0; i < count; i++) {
        // Alternate between different sizes
        const scale = 0.5 + (i % 2) * 0.5; // Alternates between 0.5 and 1.0
        container.style.width = `${800 * scale}px`;
        container.style.height = `${400 * scale}px`;

        // Wait for ResizeObserver to fire (it fires asynchronously)
        await new Promise((resolve) => requestAnimationFrame(resolve));

        await chart.waitForUpdate();
    }

    // Restore original size
    container.style.width = originalWidth;
    container.style.height = originalHeight;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await chart.waitForUpdate();

    return performance.now() - start;
}

/** inScope */
async function performInitialLoad(): Promise<number> {
    const start = performance.now();
    await chart.update(options);
    await chart.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: [
                    {
                        params: { Operation: 'Chart Update' },
                        run: performInitialLoad,
                    },
                ],
            },
            {
                id: 'resize',
                label: 'Resize',
                variants: [
                    {
                        params: { Repetitions: '10x' },
                        run: () => performResize(10),
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
            expectedRetainedSizeMB: 3.5,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
