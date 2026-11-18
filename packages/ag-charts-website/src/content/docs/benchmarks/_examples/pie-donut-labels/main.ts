// @ag-skip-fws
/* @ag-options-extract */
import { AgCharts, AgStandaloneChartOptions, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performInitialLoad } from './benchmarkUtils';
import { getSectorData } from './data';

(window as any).agChartsDebug = 'scene:stats:verbose';

const SECTOR_COUNTS = [50, 500];
const FIRST_SEED = 1337;

const options: AgStandaloneChartOptions = {
    container: document.getElementById('myChart'),
    data: getSectorData(SECTOR_COUNTS[0]),
    animation: { enabled: false },
    legend: { enabled: false },
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            sectorLabelKey: 'name',
            calloutLabel: { enabled: false },
            sectorLabel: { enabled: true },
        },
    ],
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };

const LABEL_OFF = { enabled: false };
const LABEL_NO_FIT = { enabled: true };
const LABEL_TRUNCATE = { enabled: true, wrapping: 'on-space', truncate: true };

const LABEL_VARIANTS = [
    { name: 'Off', sectorLabel: LABEL_OFF },
    { name: 'No fit options', sectorLabel: LABEL_NO_FIT },
    { name: 'Wrap + truncate', sectorLabel: LABEL_TRUNCATE },
];

/** The chart a data-update variant measures, prepared during its first warmup run. */
const prepared: { variant?: string; chart?: unknown; seed: number } = { seed: FIRST_SEED };

/** Callout labels stay off, so only the sector labels are measured. */
/** inScope */
function seriesOptions(type: 'pie' | 'donut', sectorCount: number, sectorLabel: object): AgStandaloneChartOptions {
    return {
        ...options,
        data: getSectorData(sectorCount, FIRST_SEED),
        series: [
            {
                type,
                angleKey: 'value',
                sectorLabelKey: 'name',
                calloutLabel: { enabled: false },
                sectorLabel,
                ...(type === 'donut' ? { innerRadiusRatio: 0.5 } : {}),
            } as any,
        ],
    };
}

/** inScope */
function resetPreparedChart() {
    prepared.variant = undefined;
    prepared.chart = undefined;
    prepared.seed = FIRST_SEED;
}

/** Re-solves the labels against new values, replaying the same seed sequence for every variant. */
/** inScope */
async function performDataUpdate(type: 'pie' | 'donut', sectorCount: number, sectorLabel: object): Promise<number> {
    const variant = `${type}:${sectorCount}:${JSON.stringify(sectorLabel)}`;
    if (prepared.variant !== variant || prepared.chart !== chartRef.current) {
        await performInitialLoad(seriesOptions(type, sectorCount, sectorLabel), chartRef, create);
        prepared.variant = variant;
        prepared.chart = chartRef.current;
        prepared.seed = FIRST_SEED;
    }
    const chart = chartRef.current!;
    prepared.seed++;
    const data = getSectorData(sectorCount, prepared.seed);
    const start = performance.now();
    await chart.updateDelta({ data });
    await chart.waitForUpdate();
    return performance.now() - start;
}

function create(opts: AgStandaloneChartOptions) {
    return AgCharts.create(opts);
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const testCases: BenchmarkConfig['testCases'] = [];
    for (const type of ['pie', 'donut'] as const) {
        testCases.push({
            id: `${type}-initial-load`,
            label: `${type} initial load`,
            variants: SECTOR_COUNTS.flatMap((count) =>
                LABEL_VARIANTS.map(({ name, sectorLabel }) => ({
                    params: { Sectors: String(count), Labels: name },
                    run: () => performInitialLoad(seriesOptions(type, count, sectorLabel), chartRef, create),
                }))
            ),
        });
        testCases.push({
            id: `${type}-data-update`,
            label: `${type} data update`,
            setup: resetPreparedChart,
            teardown: resetPreparedChart,
            variants: SECTOR_COUNTS.flatMap((count) =>
                LABEL_VARIANTS.map(({ name, sectorLabel }) => ({
                    params: { Sectors: String(count), Labels: name },
                    run: () => performDataUpdate(type, count, sectorLabel),
                }))
            ),
        });
    }

    return {
        testCases,
        config: {
            updatesPerTest: 10,
            maxCollectionTimeMs: 15000,
            warmupUpdates: 2,
        },
        metadata: {
            sectorCounts: SECTOR_COUNTS,
            version: VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
