// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgChartInstance, AgCharts, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';

type Datum = { x: number; y: number };

type Method =
    | 'updateDelta() same rows'
    | 'updateDelta() +1 row'
    | 'updateDelta() rolling'
    | 'applyTransaction() add'
    | 'applyTransaction() rolling';

const METHODS: Method[] = [
    'updateDelta() same rows',
    'updateDelta() +1 row',
    'updateDelta() rolling',
    'applyTransaction() add',
    'applyTransaction() rolling',
];

const baseOptions: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
};

/** inScope */
function createOptions(points: number, data: Datum[]): AgCartesianChartOptions {
    return {
        ...baseOptions,
        title: { text: `Line chart with ${points} points` },
        data,
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    };
}
/* @ag-options-end */

let chart: AgChartInstance | null = null;
let chartKey = '';
let data: Datum[] = [];
let nextX = 0;
let seed = 0;

/** inScope */
function makeDatum(x: number, s: number): Datum {
    return { x, y: 10 + ((x + s) % 17) };
}

/** inScope */
async function ensureChart(points: number, method: Method): Promise<AgChartInstance> {
    const key = `${points}|${method}`;
    if (chart != null && chartKey === key) {
        return chart;
    }
    chart?.destroy();
    chartKey = key;
    seed = 0;
    data = Array.from({ length: points }, (_, i) => makeDatum(i, seed));
    nextX = points;
    chart = AgCharts.create(createOptions(points, data));
    await chart.waitForUpdate();
    return chart;
}

/** inScope */
async function performStreamingUpdate(points: number, method: Method): Promise<number> {
    const target = await ensureChart(points, method);
    let update: () => Promise<unknown>;
    switch (method) {
        case 'updateDelta() same rows': {
            const s = ++seed;
            data = data.map((d) => makeDatum(d.x, s));
            update = () => target.updateDelta({ data });
            break;
        }
        case 'updateDelta() +1 row':
            data = [...data, makeDatum(nextX++, seed)];
            update = () => target.updateDelta({ data });
            break;
        case 'updateDelta() rolling':
            data = [...data.slice(1), makeDatum(nextX++, seed)];
            update = () => target.updateDelta({ data });
            break;
        case 'applyTransaction() add': {
            const add = [makeDatum(nextX++, seed)];
            data.push(add[0]);
            update = () => target.applyTransaction({ add });
            break;
        }
        case 'applyTransaction() rolling': {
            const add = [makeDatum(nextX++, seed)];
            const remove = [data.shift()!];
            data.push(add[0]);
            update = () => target.applyTransaction({ add, remove });
            break;
        }
    }
    const start = performance.now();
    await update();
    await target.waitForUpdate();
    return performance.now() - start;
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [600, 6_000, 60_000].map((points) => ({
            // AG-18914
            id: `stream-${points}`,
            label: `Streaming Line (${points.toLocaleString('en-GB')} points)`,
            variants: METHODS.map((method) => ({
                params: { Points: points.toLocaleString('en-GB'), Method: method },
                run: () => performStreamingUpdate(points, method),
            })),
        })),
        config: {
            updatesPerTest: 50,
            maxCollectionTimeMs: 5000,
            warmupUpdates: 10,
        },
        metadata: {
            seriesType: 'line',
            version: VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
