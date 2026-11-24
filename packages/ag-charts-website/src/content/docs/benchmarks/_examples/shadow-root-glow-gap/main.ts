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
        glow: { enabled: true, fill: '#000', fillOpacity: 0.35, blur: 6, spread: 8, gap: 5 },
    })),
};
/* @ag-options-end */

const chart = AgCharts.create(options);

/** inScope */
function getBenchmarkConfig() {
    const config = getShadowRootConfig(
        ['glow-gap-bar', 'glow-gap-scatter'],
        chart,
        (opts) => AgCharts.create(opts),
        VERSION,
        { getRows, getHeatmapRows }
    );
    // Every case casts a glow, so the comparison leaves out a release before 15.0.0 too.
    return { ...config, metadata: { ...config.metadata, minVersion: '15.0.0' } };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
