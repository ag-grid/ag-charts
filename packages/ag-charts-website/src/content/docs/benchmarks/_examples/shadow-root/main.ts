// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-enterprise';

import { initBenchmark } from './benchmarkHarness';
import { getHeatmapRows, getRows } from './data';
import { getShadowRootConfig } from './shadowRootCases';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getRows(20, 4, true),
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    series: Array.from({ length: 4 }, (_, i) => ({
        type: 'bar' as const,
        xKey: 'x',
        yKey: `y${i}`,
        shadow: { enabled: true, fill: '#000', fillOpacity: 0.5, xOffset: 4, yOffset: 4, blur: 8, spread: 14 },
    })),
};
/* @ag-options-end */

const chart = AgCharts.create(options);

// `series-glow` and the `glow-gap` cases are in shadow-root-series-glow and shadow-root-glow-gap, so that each page fits
// the per-example timeout.
/** inScope */
function getBenchmarkConfig() {
    return getShadowRootConfig(
        [
            'bars-spread',
            'bars-large',
            'areas-markers',
            'highlight',
            'many-markers',
            'one-series',
            'series-highlight',
            'item-shadow-bar',
            'item-shadow-heatmap',
            'item-shadow-scatter',
            'theme-defaults',
        ],
        chart,
        (opts) => AgCharts.create(opts),
        VERSION,
        { getRows, getHeatmapRows }
    );
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
