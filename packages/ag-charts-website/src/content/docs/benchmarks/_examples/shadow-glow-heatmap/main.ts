// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, AgColorScale, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performDatumHighlight, performInitialLoad } from './benchmarkUtils';

// A heatmap whose cells are coloured by `colorKey` through a colour scale, so that its cells have many colours. When a cell
// is hovered, the others cast a `glow` that has no `fill`, which takes the colour of each cell.
const COLUMNS = 30;
const ROWS = 20;

const SCALES: Record<string, AgColorScale> = {
    'Colour scale': { fills: [{ color: '#2b6cb0' }, { color: '#f6e05e' }, { color: '#c53030' }] },
    'One colour': { fills: [{ color: '#2b6cb0' }, { color: '#2b6cb0' }] },
};

const data = Array.from({ length: COLUMNS * ROWS }, (_, i) => {
    const x = Math.floor(i / ROWS);
    const y = i % ROWS;
    return { time: `T${x}`, band: `B${y}`, level: (Math.sin(x / 3 + y / 4) + 1) * 50 };
});

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    legend: { enabled: false },
    data,
    series: [
        {
            type: 'heatmap',
            xKey: 'time',
            yKey: 'band',
            colorKey: 'level',
            colorScale: SCALES['Colour scale'],
            highlight: { unhighlightedItem: { glow: { enabled: true } } },
        },
    ],
};
/* @ag-options-end */

(window as any).agChartsDebug = 'scene:stats';

/** inScope */
function buildOptions(scale: string, glowOn: boolean): AgCartesianChartOptions {
    return {
        ...options,
        series: [
            {
                type: 'heatmap',
                xKey: 'time',
                yKey: 'band',
                colorKey: 'level',
                colorScale: SCALES[scale],
                highlight: glowOn ? { unhighlightedItem: { glow: { enabled: true } } } : undefined,
            },
        ],
    };
}

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

let current: { scale: string; glowOn: boolean } | undefined;

// Rebuilds the chart for a colour scale and glow setting, outside the timing, so that each variant starts afresh.
/** inScope */
async function prepare(scale: string, glowOn: boolean) {
    if (current?.scale === scale && current.glowOn === glowOn && chartRef.current != null) return;

    chartRef.current?.destroy();
    chartRef.current = null;
    current = { scale, glowOn };
    chartRef.current = AgCharts.create({ ...buildOptions(scale, glowOn), container });
    await chartRef.current.waitForUpdate();
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const variants: BenchmarkConfig['testCases'][number]['variants'] = [];
    for (const scale of Object.keys(SCALES)) {
        for (const glowOn of [false, true]) {
            const params = { Colours: scale, Glow: glowOn ? 'On' : 'Off' };
            variants.push({
                params: { ...params, Operation: 'Chart Create' },
                run: () =>
                    performInitialLoad({ ...buildOptions(scale, glowOn), container }, chartRef, (opts) => {
                        current = undefined;
                        return AgCharts.create(opts);
                    }),
            });
            variants.push({
                params: { ...params, Operation: 'Hover x10' },
                run: async () => {
                    await prepare(scale, glowOn);
                    return performDatumHighlight(chartRef.current!, container, 10);
                },
            });
        }
    }

    return {
        testCases: [{ id: 'heatmap-glow', label: `Heatmap of ${COLUMNS * ROWS} cells, glow with no fill`, variants }],
        config: {
            updatesPerTest: 10,
            maxCollectionTimeMs: 30000,
            warmupUpdates: 2,
        },
        metadata: {
            version: VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
