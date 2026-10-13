<script lang="ts">
import { type AgCartesianChartOptions, type AgColorScale, type AgHeatmapSeriesOptions } from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { type Instrument, type PeerHeatmapCell, type PeerPerformanceFeed, sectorPeers } from '../data';
import { diffWindow } from '../windowTransaction';

// Spread colour ramp, tight → wide: near-background for a tight spread, ramping
// up the chart palette as peers diverge. Mixed via $ref onto the palette tokens.
const SPREAD_COLOR_SCALE: AgColorScale = {
    domain: [0, 0.4],
    fills: [
        {
            color: { ref: 'chartBackgroundColor', mix: 0.4, ontoColor: 'var(--fin-chart-palette-0)' },
            name: '(Tight) 0',
        },
        { color: { ref: 'chartBackgroundColor', mix: 0.2, ontoColor: 'var(--fin-chart-palette-6)' }, name: '0.2' },
        { color: 'var(--fin-chart-palette-2)', name: '0.4 (Wide)' },
    ],
};

const fmtSpread = (value: number) => `${value.toFixed(2)}%`;

// Module-scope so the series identity is stable across instances — a fresh identity per chart
// would force the chart's slow-path options processing instead of the data-only fast path.
const HEATMAP_SERIES: AgHeatmapSeriesOptions = {
    type: 'heatmap',
    xKey: 'time',
    xName: 'Time',
    yKey: 'peer',
    yName: 'Peer',
    colorKey: 'value',
    colorName: 'Spread',
    colorScale: SPREAD_COLOR_SCALE,
    label: { enabled: false },
    stroke: 'var(--fin-panel)',
    strokeWidth: 0.5,
    tooltip: {
        renderer: ({ datum }: { datum: PeerHeatmapCell }) => ({
            heading: datum.time,
            data: [
                { label: 'Ticker', value: datum.peer },
                { label: 'Spread', value: fmtSpread(datum.value) },
            ],
        }),
    },
};

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);
</script>

<script setup lang="ts">
import { ref, watch } from 'vue';

import { AgCharts } from 'ag-charts-vue3';

const props = defineProps<{
    instrument: Instrument;
    peerFeed: PeerPerformanceFeed;
    /** Bumped every stream tick so the live buckets recompute. */
    peerTick: number;
    /** Trailing window in one-minute buckets; shared across charts. */
    windowMinutes: number;
}>();

const chartComponent = ref<InstanceType<typeof AgCharts>>();

// The instrument is fixed for this instance: the parent keys the component on the ticker.
const peers = sectorPeers(props.instrument.ticker);
// The cells currently rendered, diffed against each new window for the transaction.
let shownWindow: PeerHeatmapCell[] = props.peerFeed.rollingSpread(peers, props.windowMinutes);
// Tracks the window size so a resize can be told apart from a streaming tick.
let shownWindowMinutes = props.windowMinutes;

// Seeded once, as a plain object; later buckets stream in via applyTransaction below.
const options = {
    theme: THEME,
    data: shownWindow,
    // The leftmost and trailing buckets recompute each tick, so matching on the composite
    // cell id lets those arrive as `update`s while a rolled bucket adds/removes cells.
    dataIdKey: 'key',
    series: [HEATMAP_SERIES],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            line: { enabled: false },
            label: { autoRotate: false },
        },
        y: { type: 'category', position: 'left', line: { enabled: false } },
    },
    gradientLegend: {
        enabled: true,
        position: 'bottom',
        gradient: { thickness: 4, preferredLength: 400 },
        scale: { padding: 4 },
        spacing: 12,
    },
    padding: {
        top: 8,
        right: 2,
        bottom: 2,
        left: 2,
    },
} as AgCartesianChartOptions;

// peerTick is the recompute signal: the feed mutates in place.
watch([() => props.peerTick, () => props.windowMinutes], ([, windowMinutes]) => {
    const chart = chartComponent.value?.chart;
    const baseline = shownWindow;
    const data = props.peerFeed.rollingSpread(peers, windowMinutes);
    shownWindow = data;
    // A resize swaps most buckets at once; incremental transactions would leave the category
    // axis domain stale, so replace the data to rebuild it. Ticks stay incremental below.
    if (windowMinutes !== shownWindowMinutes) {
        shownWindowMinutes = windowMinutes;
        chart?.updateDelta({ data }).catch(logError);
        return;
    }
    const transactions = diffWindow(
        baseline,
        data,
        (cell) => cell.key,
        (a, b) => a.value === b.value
    );
    for (const transaction of transactions) {
        chart?.applyTransaction(transaction).catch(logError);
    }
});
</script>

<template>
    <div class="fin-detail-card">
        <div class="fin-detail-card-title">Price spread across peers</div>
        <div class="fin-detail-chart">
            <AgCharts ref="chartComponent" :options="options" :style="{ height: '100%', width: '100%' }" />
        </div>
    </div>
</template>
