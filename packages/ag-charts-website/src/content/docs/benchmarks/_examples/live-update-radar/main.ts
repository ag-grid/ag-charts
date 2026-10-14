// @ag-skip-fws
/* @ag-options-extract */
import { AgChartInstance, AgCharts, AgPolarChartOptions, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';

type Shape = 'polygon' | 'circle';

type Datum = { band: string; level: number };

const baseOptions: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
};

/** inScope */
function createOptions(categories: number, shape: Shape, data: Datum[]): AgPolarChartOptions {
    return {
        ...baseOptions,
        title: { text: `Radar line with ${categories} categories` },
        data,
        series: [{ type: 'radar-line', angleKey: 'band', radiusKey: 'level' }],
        axes: {
            angle: { type: 'angle-category', label: { enabled: false } },
            radius: { type: 'radius-number', shape },
        },
    };
}
/* @ag-options-end */

let chart: AgChartInstance | null = null;
let chartKey = '';
let seed = 0;

/** inScope */
function generateData(categories: number, s: number): Datum[] {
    return Array.from({ length: categories }, (_, i) => ({
        band: `Band ${i + 1}`,
        level: 50 + 40 * Math.sin(i / 7 + s),
    }));
}

/** inScope */
async function ensureChart(categories: number, shape: Shape): Promise<AgChartInstance> {
    const key = `${categories}|${shape}`;
    if (chart != null && chartKey === key) {
        return chart;
    }
    chart?.destroy();
    chartKey = key;
    seed = 0;
    chart = AgCharts.create(createOptions(categories, shape, generateData(categories, seed)));
    await chart.waitForUpdate();
    return chart;
}

/** inScope */
async function performRadarUpdate(categories: number, shape: Shape): Promise<number> {
    const target = await ensureChart(categories, shape);
    const data = generateData(categories, ++seed);
    const start = performance.now();
    await target.updateDelta({ data });
    await target.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'radar-update',
                label: 'Radar Data Update',
                // Keyed `axes` options were added in 13.0.0 (12.x takes an array)
                minVersion: '13.0.0',
                variants: [26, 52, 104, 208, 416].flatMap((categories) =>
                    (['polygon', 'circle'] as Shape[]).map((shape) => ({
                        params: { Categories: String(categories), Grid: shape },
                        run: () => performRadarUpdate(categories, shape),
                    }))
                ),
            },
        ],
        config: {
            updatesPerTest: 30,
            maxCollectionTimeMs: 6000,
            warmupUpdates: 5,
        },
        metadata: {
            seriesType: 'radar-line',
            version: VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
