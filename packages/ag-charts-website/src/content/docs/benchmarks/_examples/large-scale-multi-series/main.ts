// @ag-skip-fws

/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, SeriesVisibilityState, performInitialLoad, performLegendToggle } from './benchmarkUtils';

(window as any).agChartsDebug = 'scene:stats';

function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
        a >>>= 0;
        b >>>= 0;
        c >>>= 0;
        d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

export function seedRandom(seed = 1337): () => number {
    const realSeed = seed ^ 0xdeadbeef; // 32-bit seed with optional XOR value
    // Pad seed with Phi, Pi and E.
    // https://en.wikipedia.org/wiki/Nothing-up-my-sleeve_number
    return sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, realSeed);
}

const random = seedRandom(75023847123);

const amountOfCurves = 500;
const amountOfDataPointsPerCurve = 10;
const maxYgeneratedValue = 100;
const generatedData: any[] = [];
const generatedSeries: AgLineSeriesOptions[] = [];

for (let k = 0; k < amountOfDataPointsPerCurve; k++) {
    let obj = { x: k };
    for (let i = 0; i < amountOfCurves; i++) {
        obj = {
            ...obj,
            ['y' + i]: Math.floor(random() * maxYgeneratedValue),
        };
        generatedSeries[i] = {
            type: 'line',
            xKey: 'x',
            yKey: 'y' + i,
            marker: {
                enabled: true,
            },
        };
    }
    generatedData[k] = obj;
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: '#6806 - AG-Chart: Bad performance on 100+ series objects',
        fontSize: 18,
    },
    data: generatedData,
    series: generatedSeries,
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };

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
                        params: { Repetitions: '4x' },
                        run: () => performLegendToggle(chartRef.current!, options, visibilityState, 4),
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 10,
            maxCollectionTimeMs: 30000,
            warmupUpdates: 2,
        },
        metadata: {
            dataPoints: generatedData.length,
            seriesCount: seriesCount,
            version: VERSION,
            expectedRetainedSizeMB: 10,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
