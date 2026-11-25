// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-enterprise';

import { initBenchmark } from './benchmarkHarness';
import { getHeatmapRows, getRows } from './data';
import { getShadowRootConfig } from './shadowRootCases';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    width: 1400,
    height: 600,
    data: getRows(1000, 20, false),
    axes: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
    series: Array.from({ length: 20 }, (_, i) => ({
        type: 'line' as const,
        xKey: 'x',
        yKey: `y${i}`,
        marker: { enabled: true, size: 6, glow: { fillOpacity: 0.35, blur: 6, spread: 4 } },
    })),
};
/* @ag-options-end */

const chart = AgCharts.create(options);

/** inScope */
function getBenchmarkConfig() {
    return getShadowRootConfig(['series-glow'], chart, (opts) => AgCharts.create(opts), VERSION, {
        getRows,
        getHeatmapRows,
    });
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
