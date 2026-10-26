// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCartesianChartOptions,
    AgCharts,
    AgDropShadowOptions,
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    VERSION,
} from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performDatumHighlight, performInitialLoad } from './benchmarkUtils';
import { getRows } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
]);

(window as any).agChartsDebug = 'scene:stats';

const SHADOW: AgDropShadowOptions = { enabled: true, color: 'rgba(0, 0, 0, 0.5)', xOffset: 4, yOffset: 4, blur: 8 };
const SPREAD_SHADOW: AgDropShadowOptions = { ...SHADOW, spread: 14 };

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
        shadow: SPREAD_SHADOW,
    })),
};
/* @ag-options-end */

type Scenario = 'bars' | 'areas' | 'highlight' | 'many-markers';
type Variants = BenchmarkConfig['testCases'][number]['variants'];

// What each scenario draws, so that the shadows of the series overlap. The shadow is off in the first variant of each, to
// show what it costs. Builds from before shadows reached these series, or before `spread`, ignore the options.
// `many-markers` is 1,400px wide, as a line series draws no markers when its points are under 1px apart.
/** inScope */
function buildOptions(scenario: Scenario, shadowOn: boolean): AgCartesianChartOptions {
    const shadow = <T extends AgDropShadowOptions>(value: T) => (shadowOn ? value : undefined);

    if (scenario === 'bars') {
        return {
            data: getRows(20, 4, true),
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            series: Array.from({ length: 4 }, (_, i) => ({
                type: 'bar' as const,
                xKey: 'x',
                yKey: `y${i}`,
                shadow: shadow(SPREAD_SHADOW),
            })),
        };
    }

    if (scenario === 'many-markers') {
        return {
            width: 1400,
            height: 600,
            data: getRows(1000, 20, false),
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            series: Array.from({ length: 20 }, (_, i) => ({
                type: 'line' as const,
                xKey: 'x',
                yKey: `y${i}`,
                marker: { enabled: true, size: 6, shadow: shadow(SHADOW) },
            })),
        };
    }

    const highlighted = scenario === 'highlight';
    return {
        data: getRows(200, 3, false),
        axes: { x: { type: 'number' }, y: { type: 'number' } },
        series: Array.from({ length: 3 }, (_, i) => ({
            type: 'area' as const,
            xKey: 'x',
            yKey: `y${i}`,
            fillOpacity: 0.6,
            shadow: shadow(SHADOW),
            marker: { enabled: true, size: 8, shadow: shadow(SHADOW) },
            ...(highlighted ? { highlight: { highlightedItem: { shadow: shadow(SPREAD_SHADOW) } } } : {}),
        })),
    };
}

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

let current: { scenario: Scenario; shadowOn: boolean; options: AgCartesianChartOptions } | undefined;

// Rebuilds the chart for a scenario and shadow setting, outside the timing, so that each variant starts afresh.
/** inScope */
async function prepare(scenario: Scenario, shadowOn: boolean): Promise<AgCartesianChartOptions> {
    if (current?.scenario === scenario && current.shadowOn === shadowOn && chartRef.current != null) {
        return current.options;
    }

    chartRef.current?.destroy();
    chartRef.current = null;
    const next: AgCartesianChartOptions = { ...buildOptions(scenario, shadowOn), container };
    current = { scenario, shadowOn, options: next };
    chartRef.current = AgCharts.create(next);
    await chartRef.current.waitForUpdate();
    return next;
}

// Redraws the whole chart, from data that is new to it.
/** inScope */
async function performRedraw(chartOptions: AgCartesianChartOptions): Promise<number> {
    const data = (chartOptions.data ?? []).map((row) => ({ ...row }));

    const start = performance.now();
    await chartRef.current!.update({ ...chartOptions, data });
    return performance.now() - start;
}

/** inScope */
function variantsOf(scenario: Scenario, operations: Record<string, (o: AgCartesianChartOptions) => Promise<number>>) {
    const variants: Variants = [];
    for (const shadowOn of [false, true]) {
        for (const [operation, run] of Object.entries(operations)) {
            variants.push({
                params: { Operation: operation, Shadow: shadowOn ? 'On' : 'Off' },
                run: async () => run(await prepare(scenario, shadowOn)),
            });
        }
    }
    return variants;
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const create = (chartOptions: AgCartesianChartOptions) =>
        performInitialLoad(chartOptions, chartRef, (opts) => AgCharts.create(opts));

    return {
        testCases: [
            {
                id: 'bars-spread',
                label: 'Bars, shadow spread 14',
                variants: variantsOf('bars', { 'Chart Create': create, 'Chart Redraw': performRedraw }),
            },
            {
                id: 'areas-markers',
                label: 'Overlapping areas and markers',
                variants: variantsOf('areas', { 'Chart Create': create, 'Chart Redraw': performRedraw }),
            },
            {
                id: 'highlight',
                label: 'Highlighted marker shadow',
                variants: variantsOf('highlight', {
                    'Hover x10': () => performDatumHighlight(chartRef.current!, container, 10),
                }),
            },
            {
                id: 'many-markers',
                label: '20 series x 1,000 points, marker shadows',
                variants: variantsOf('many-markers', { 'Chart Create': create, 'Chart Redraw': performRedraw }),
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
