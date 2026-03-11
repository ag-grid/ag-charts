// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, DataRef, performInitialLoad, performUpdate, performUpdateById } from './benchmarkUtils';

const INITIAL_POINTS = 100_000;
const DATA_INTERVAL_MS = 250;
const START_TIMESTAMP = Date.UTC(2024, 0, 1, 0, 0, 0);

type Datum = {
    id: number;
    timestamp: number;
    value: number;
};

function generateData(count: number): Datum[] {
    const result: Datum[] = [];
    for (let i = 0; i < count; i++) {
        const timestamp = START_TIMESTAMP + i * DATA_INTERVAL_MS;
        const trend = Math.sin(i / 240) * 40 + Math.cos(i / 80) * 25;
        const volatility = Math.sin(i / 15) * 5;
        const baseline = 1_000 + i * 0.02;
        result.push({
            id: i,
            timestamp,
            value: Number((baseline + trend + volatility).toFixed(2)),
        });
    }
    return result;
}

const dataRef: DataRef<Datum> = { data: generateData(INITIAL_POINTS) };

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    dataIdKey: 'id',
    data: dataRef.data,
    animation: { enabled: false },
    legend: { enabled: false },
    axes: {
        x: {
            type: 'time',
            nice: false,
            label: { format: '%H:%M:%S' },
        },
        y: {
            type: 'number',
            title: { text: 'Value' },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'value',
            marker: { enabled: false },
            strokeWidth: 1,
        },
    ],
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };

/** inScope */
async function localPerformInitialLoad(): Promise<number> {
    dataRef.data = generateData(INITIAL_POINTS);
    options.data = dataRef.data;
    return performInitialLoad(options, chartRef, (opts) => AgCharts.create(opts));
}

function selectRandomIndices(count: number, total: number): number[] {
    const indices = new Set<number>();
    while (indices.size < count && indices.size < total) {
        indices.add(Math.floor(Math.random() * total));
    }
    return Array.from(indices);
}

function mutateRandomSubset(dataRef: DataRef<Datum>, count: number): Datum[] {
    const indices = selectRandomIndices(count, dataRef.data.length);
    const items: Datum[] = [];
    for (const idx of indices) {
        const item = dataRef.data[idx];
        item.value = Number((item.value + (Math.random() - 0.5) * 200).toFixed(2));
        items.push(item);
    }
    return items;
}

function replaceRandomSubset(dataRef: DataRef<Datum>, count: number): Datum[] {
    const indices = selectRandomIndices(count, dataRef.data.length);
    const replacements: Datum[] = [];
    for (const idx of indices) {
        const item = dataRef.data[idx];
        const replacement: Datum = {
            id: item.id,
            timestamp: item.timestamp,
            value: Number((item.value + (Math.random() - 0.5) * 200).toFixed(2)),
        };
        dataRef.data[idx] = replacement;
        replacements.push(replacement);
    }
    return replacements;
}

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
                        run: localPerformInitialLoad,
                    },
                ],
            },
            {
                id: 'update-100',
                label: 'Update 100 Random Items',
                minVersion: '12.3.0',
                variants: [
                    {
                        params: { Method: 'Reference (mutate)' },
                        run: () =>
                            performUpdate(chartRef.current!, dataRef, 100, (d: Datum) => {
                                d.value = Number((d.value + (Math.random() - 0.5) * 200).toFixed(2));
                            }),
                    },
                    {
                        params: { Method: 'ID-based (replace)' },
                        run: () =>
                            performUpdateById(chartRef.current!, dataRef, 100, (d: Datum) => ({
                                id: d.id,
                                timestamp: d.timestamp,
                                value: Number((d.value + (Math.random() - 0.5) * 200).toFixed(2)),
                            })),
                    },
                ],
            },
            {
                id: 'update-1000',
                label: 'Update 1000 Random Items',
                minVersion: '12.3.0',
                variants: [
                    {
                        params: { Method: 'Reference (mutate)' },
                        run: () =>
                            performUpdate(chartRef.current!, dataRef, 1000, (d: Datum) => {
                                d.value = Number((d.value + (Math.random() - 0.5) * 200).toFixed(2));
                            }),
                    },
                    {
                        params: { Method: 'ID-based (replace)' },
                        run: () =>
                            performUpdateById(chartRef.current!, dataRef, 1000, (d: Datum) => ({
                                id: d.id,
                                timestamp: d.timestamp,
                                value: Number((d.value + (Math.random() - 0.5) * 200).toFixed(2)),
                            })),
                    },
                ],
            },
            {
                id: 'update-10000',
                label: 'Update 10000 Random Items',
                minVersion: '12.3.0',
                variants: [
                    {
                        params: { Method: 'Reference (mutate)' },
                        run: () =>
                            performUpdate(chartRef.current!, dataRef, 10000, (d: Datum) => {
                                d.value = Number((d.value + (Math.random() - 0.5) * 200).toFixed(2));
                            }),
                    },
                    {
                        params: { Method: 'ID-based (replace)' },
                        run: () =>
                            performUpdateById(chartRef.current!, dataRef, 10000, (d: Datum) => ({
                                id: d.id,
                                timestamp: d.timestamp,
                                value: Number((d.value + (Math.random() - 0.5) * 200).toFixed(2)),
                            })),
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 50,
            maxCollectionTimeMs: 15000,
            warmupUpdates: 5,
        },
        metadata: {
            initialDataPoints: INITIAL_POINTS,
            seriesType: 'line',
            dataIdKey: 'id',
            version: VERSION,
            expectedRetainedSizeMB: undefined,
            expectedCanvasCount: 3,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
