// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performDatumHighlight } from './benchmarkUtils';
import { getHeatmapRows, getRows } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getRows(20, 4, true),
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    series: Array.from({ length: 4 }, (_, i) => ({ type: 'bar' as const, xKey: 'x', yKey: `y${i}` })),
};
/* @ag-options-end */

type Chart = 'Bar' | 'Scatter' | 'Heatmap';

// None of these set `highlight`, `glow` or `shadow`, so hovering measures the theme defaults.
/** inScope */
function buildOptions(chart: Chart): AgCartesianChartOptions {
    switch (chart) {
        case 'Bar':
            return options;
        case 'Scatter':
            return {
                width: 1400,
                height: 600,
                data: getRows(5000, 10, false),
                axes: { x: { type: 'number' }, y: { type: 'number' } },
                series: Array.from({ length: 10 }, (_, i) => ({
                    type: 'scatter' as const,
                    xKey: 'x',
                    yKey: `y${i}`,
                    size: 6,
                })),
            };
        case 'Heatmap':
            return {
                width: 1400,
                height: 600,
                animation: { enabled: false },
                legend: { enabled: false },
                data: getHeatmapRows(100, 100),
                series: [{ type: 'heatmap' as const, xKey: 'x', yKey: 'y', colorKey: 'level' }],
            };
    }
}

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

let current: Chart | undefined;

// Rebuilds the chart for a chart type, outside the timing, so that each variant starts afresh.
/** inScope */
async function prepare(chart: Chart) {
    if (current === chart && chartRef.current != null) return;

    chartRef.current?.destroy();
    chartRef.current = null;
    current = chart;
    chartRef.current = AgCharts.create({ ...buildOptions(chart), container });
    await chartRef.current.waitForUpdate();
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const charts: Chart[] = ['Bar', 'Scatter', 'Heatmap'];

    return {
        testCases: [
            {
                id: 'theme-defaults',
                label: 'Theme defaults',
                variants: charts.map((chart) => ({
                    params: { Operation: 'Hover x10', Chart: chart },
                    run: async () => {
                        await prepare(chart);
                        return performDatumHighlight(chartRef.current!, container, 10);
                    },
                })),
            },
        ],
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
