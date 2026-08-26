// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performDatumHighlight, performInitialLoad } from './benchmarkUtils';
import { getBarData, getScatterData } from './data';

(window as any).agChartsDebug = 'scene:stats:verbose';

const scatterData = getScatterData();
const barData = getBarData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: scatterData,
    animation: { enabled: false },
    series: [
        {
            type: 'bubble',
            xKey: 'x',
            yKey: 'y',
            sizeKey: 'size',
            labelKey: 'name',
            maxRenderedItems: 10000,
            label: {
                enabled: true,
                placement: ['top', 'bottom', 'right', 'left', 'top-right', 'bottom-left'],
                collision: { alwaysShow: false },
            },
        },
    ],
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

/** The same chart with the collision cascade taken away, isolating what placement itself costs. */
function scatterOptions(label: object): typeof options {
    return {
        ...options,
        series: [{ ...(options.series![0] as object), label } as any],
    };
}

/** The same container and animation settings, re-pointed at the bar dataset. */
function barOptions(label: object): typeof options {
    return {
        ...options,
        data: barData,
        series: [{ type: 'bar', xKey: 'category', yKey: 'value', label } as any],
        axes: {
            x: { type: 'category' },
            y: { type: 'number' },
        },
    };
}

const LABEL_OFF = { enabled: false };
const SCATTER_SINGLE = { enabled: true, placement: 'top' };
const SCATTER_CASCADE = {
    enabled: true,
    placement: ['top', 'bottom', 'right', 'left', 'top-right', 'bottom-left'],
    collision: { alwaysShow: false },
};
const BAR_SINGLE = { enabled: true, placement: 'inside-center' };
const BAR_CASCADE = {
    enabled: true,
    placement: ['inside-center', 'inside-start', 'outside-end'],
    orientation: ['horizontal', 'vertical'],
    minimumFontSize: 6,
    collision: { alwaysShow: false },
};

function create(opts: typeof options) {
    return AgCharts.create(opts);
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'scatter-labels',
                label: 'Scatter Labels',
                variants: [
                    {
                        params: { Labels: 'Off' },
                        run: () => performInitialLoad(scatterOptions(LABEL_OFF), chartRef, create),
                    },
                    {
                        params: { Labels: 'Single placement' },
                        run: () => performInitialLoad(scatterOptions(SCATTER_SINGLE), chartRef, create),
                    },
                    {
                        params: { Labels: 'Placement cascade' },
                        run: () => performInitialLoad(scatterOptions(SCATTER_CASCADE), chartRef, create),
                    },
                ],
            },
            {
                id: 'bar-labels',
                label: 'Bar Labels',
                variants: [
                    {
                        params: { Labels: 'Off' },
                        run: () => performInitialLoad(barOptions(LABEL_OFF), chartRef, create),
                    },
                    {
                        params: { Labels: 'Single placement' },
                        run: () => performInitialLoad(barOptions(BAR_SINGLE), chartRef, create),
                    },
                    {
                        params: { Labels: 'Cascade + shrink' },
                        run: () => performInitialLoad(barOptions(BAR_CASCADE), chartRef, create),
                    },
                ],
            },
            {
                id: 'highlight',
                label: 'Highlight',
                // Hover re-runs the series update, so this measures the LabelManager's cached-solve
                // path: a regression that invalidates the cache shows up here and nowhere else.
                variants: [
                    {
                        params: { Repetitions: '20x' },
                        run: async () => {
                            await performInitialLoad(scatterOptions(SCATTER_CASCADE), chartRef, create);
                            return performDatumHighlight(chartRef.current!, container, 20);
                        },
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 5,
            maxCollectionTimeMs: 15000,
            warmupUpdates: 1,
        },
        metadata: {
            dataPoints: scatterData.length,
            seriesCount: 1,
            seriesType: 'bubble',
            version: VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
