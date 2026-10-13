<script lang="ts">
import { type AgCartesianChartOptions, type AgLineSeriesOptions } from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { type Instrument, type PeerPerformanceFeed, type PerfRow, sectorPeers } from '../data';
import { diffWindow } from '../windowTransaction';

// Module-scope keeps these identities stable across instances; a fresh function per chart would
// force the chart's full options processing instead of the data-only fast path.
const PEER_TOOLTIP_RENDERER: NonNullable<NonNullable<AgLineSeriesOptions['tooltip']>['renderer']> = ({
    datum,
    yKey,
}) => ({
    data: [
        {
            label: yKey,
            value: `${datum[yKey].toFixed(1)}%`,
        },
    ],
});

const Y_LABEL_FORMATTER = ({ value }: { value: number }) => {
    if (value === 0) return '0%\nS&P 500';
    return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
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
    /** Bumped every stream tick so the live window recomputes. */
    peerTick: number;
    /** Trailing window in points (one point per bar interval, 1 min); shared across charts. */
    windowMinutes: number;
}>();

const chartComponent = ref<InstanceType<typeof AgCharts>>();

// The instrument is fixed for this instance: the parent keys the component on the ticker.
const peers = sectorPeers(props.instrument.ticker);
// The rows currently rendered, diffed against each new window for the transaction.
let shownWindow: PerfRow[] = props.peerFeed.relativePerformance(peers, props.windowMinutes);
// Tracks the window size so a resize can be told apart from a streaming tick.
let shownWindowMinutes = props.windowMinutes;

const series: AgLineSeriesOptions[] = peers.map((ticker) => ({
    type: 'line',
    xKey: 'date',
    yKey: ticker,
    yName: ticker,
    // Emphasise the selected company against its peers via stroke width only.
    strokeWidth: ticker === props.instrument.ticker ? 3 : 1,
    strokeOpacity: ticker === props.instrument.ticker ? 1 : 0.5,
    marker: { enabled: false },
    tooltip: { renderer: PEER_TOOLTIP_RENDERER },
}));

// Seeded once, as a plain object; later windows stream in via applyTransaction below.
const options = {
    theme: THEME,
    data: shownWindow,
    // A point's rebased value is fixed once computed, so ticks only add/remove whole points.
    dataIdKey: 'id',
    series,
    axes: {
        x: {
            type: 'ordinal-time',
            label: { format: '%H:%M' },
            line: { enabled: false },
            gridLine: { enabled: true },
            interval: {
                placement: 'on',
            },
        },
        y: {
            type: 'number',
            position: 'right',
            label: {
                formatter: Y_LABEL_FORMATTER,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    stroke: 'var(--fin-muted)',
                    strokeOpacity: 1,
                    strokeWidth: 1,
                },
            ],
        },
    },
    tooltip: {
        mode: 'shared',
        position: {
            anchorTo: 'pointer',
            placement: ['top'],
            yOffset: -80,
        },
    },
    legend: { enabled: true, position: 'bottom', spacing: 12, maxHeight: 24 },
    animation: { enabled: false },
    padding: {
        top: 8,
        right: 2,
        bottom: 2,
        left: 2,
    },
} as AgCartesianChartOptions;

// peerTick is the recompute signal: the feed mutates in place, so its own reference never changes
// when a new point streams in.
watch([() => props.peerTick, () => props.windowMinutes], ([, windowMinutes]) => {
    const chart = chartComponent.value?.chart;
    const baseline = shownWindow;
    const data = props.peerFeed.relativePerformance(peers, windowMinutes);
    shownWindow = data;
    // A resize swaps most of the window at once; incremental transactions would leave the
    // ordinal-time axis domain stale, so replace the data to rebuild it. Ticks stay incremental below.
    if (windowMinutes !== shownWindowMinutes) {
        shownWindowMinutes = windowMinutes;
        chart?.updateDelta({ data }).catch(logError);
        return;
    }
    const transactions = diffWindow(baseline, data, (row) => row.id);
    for (const transaction of transactions) {
        chart?.applyTransaction(transaction).catch(logError);
    }
});
</script>

<template>
    <div class="fin-detail-card">
        <div class="fin-detail-card-title">Peer performance vs S&amp;P 500</div>
        <div class="fin-detail-chart">
            <AgCharts ref="chartComponent" :options="options" :style="{ height: '100%', width: '100%' }" />
        </div>
    </div>
</template>
