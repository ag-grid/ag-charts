<script lang="ts">
import { type AgChartInstance, type AgFinancialChartOptions, type AgZoomEvent } from 'ag-charts-community';

import { diffBars, toDatum } from '../barTransaction';
import { THEME } from '../chartTheme';
import { BAR_INTERVAL_MS, type Bar } from '../data';
import { type ChartDatum } from '../types';

// Scoped to this chart: the preset omits `padding` from its option types, so the theme is the
// only lever, and the other charts on the page keep the default.
const FINANCIAL_THEME = {
    ...THEME,
    overrides: {
        ...THEME.overrides,
        common: {
            ...THEME.overrides.common,
            padding: {
                top: 8,
                right: 12,
            },
        },
    },
};

// Slack when pinning history, so the bar on the boundary is never the one the feed drops.
const RETAIN_MARGIN_BARS = 2;
// A view this close to the newest bar counts as watching the live edge.
const LIVE_EDGE_RATIO = 1 - 1e-6;

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);

type FinancialChartInstance = AgChartInstance<AgFinancialChartOptions>;

const rangeStart = (data: ChartDatum[], rangeMinutes: number) => ({
    // `end` is omitted so the range stays pinned to the newest bar as it streams in.
    rangeX: { start: { __type: 'date' as const, value: data[Math.max(0, data.length - rangeMinutes)].time } },
});

/** The zoom's `rangeX.start` as epoch ms; an ordinal-time axis reports a `Date` or a grouping of one. */
function rangeStartTime(range: AgZoomEvent['rangeX']): number | undefined {
    const start = range?.start;
    const value = start != null && typeof start === 'object' && 'value' in start ? start.value : start;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;
    return undefined;
}

/** Show the trailing `rangeMinutes`, and make it what a zoom reset restores. */
function applyRange(chart: FinancialChartInstance, data: ChartDatum[], rangeMinutes: number) {
    return chart.setState({ ...chart.getState(), zoom: rangeStart(data, rangeMinutes) });
}

/**
 * Bring the chart's data up to date with the feed's window, resolving once the chart holds it: a
 * range measured off the mirror but applied against the pre-transaction domain would be clamped.
 */
function syncData(chart: FinancialChartInstance, data: ChartDatum[], bars: Bar[]): Promise<void> {
    const transaction = diffBars(data, bars);
    return transaction ? chart.applyTransaction(transaction) : Promise.resolve();
}

function createFinancialOptions(
    data: ChartDatum[],
    chartType: AgFinancialChartOptions['chartType'],
    rangeMinutes: number,
    onZoom: (event: AgZoomEvent) => void
): AgFinancialChartOptions {
    return {
        theme: FINANCIAL_THEME,
        data,
        // Bars carry a stable epoch-ms `time`, so a tick appends single bars.
        dataIdKey: 'time',
        chartType,
        dateKey: 'date',
        openKey: 'open',
        highKey: 'high',
        lowKey: 'low',
        closeKey: 'close',
        volumeKey: 'volume',
        volume: true,
        rangeButtons: false,
        // The visible range is zoom state, not a data window, so streaming only ever appends.
        initialState: { zoom: rangeStart(data, rangeMinutes) },
        listeners: { zoom: onZoom },
    } as AgFinancialChartOptions;
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

import { AgFinancialCharts } from 'ag-charts-vue3';

const props = defineProps<{
    bars: Bar[];
    /** Visible trailing range in minutes; bars are one minute apart, so this is a bar count. */
    rangeMinutes: number;
    /** The instrument on show. A change swaps the whole series (see the watcher below). */
    ticker: string;
}>();
const emit = defineEmits<{
    /**
     * Reports the oldest bar on screen (epoch ms), or `undefined` when the view is zoomed out and
     * has no range to protect. The feed keeps everything newer.
     */
    retainFrom: [time?: number];
}>();

// The wrapper component creates the chart on mount and keeps it as `chart`.
const chartComponent = ref<InstanceType<typeof AgFinancialCharts>>();
const chartInstance = (): FinancialChartInstance | undefined => chartComponent.value?.chart;

// OPTIMIZATION: the chart's data, mirrored and mutated in place so a tick touches only the
// changed ends rather than rebuilding the whole (unbounded) history.
let data: ChartDatum[] = props.bars.map(toDatum);
// Tracks the range so a range-button press can be told apart from a streaming tick.
let shownRangeMinutes = props.rangeMinutes;
// Likewise the instrument, so a selection can be told apart from a tick.
let shownTicker = props.ticker;
// Whether the view is watching the live edge. Away from it ticks are held back, since applying
// one re-derives the zoom and creeps the pinned bars by a fraction of a pixel.
let live = true;
let flush = 0;

function scheduleFlush() {
    if (flush) return;
    // Out of the update cycle that raised the zoom event, so the catch-up is not re-entrant.
    flush = requestAnimationFrame(() => {
        flush = 0;
        const chart = chartInstance();
        if (!chart) return;
        syncData(chart, data, props.bars).catch(logError);
    });
}

function onZoom(event: AgZoomEvent) {
    const zoomedOut = event.ratioX.start <= 0 && event.ratioX.end >= 1;
    const start = zoomedOut ? undefined : rangeStartTime(event.rangeX);
    emit('retainFrom', start == null ? undefined : start - RETAIN_MARGIN_BARS * BAR_INTERVAL_MS);

    const wasLive = live;
    live = zoomedOut || event.ratioX.end >= LIVE_EDGE_RATIO;
    if (live && !wasLive) scheduleFlush();
}

// Seeded once, as a plain object: a new options object would send the wrapper down the slow full
// options path and clobber the toolbar's live chart-type selection. Later bars stream in via the
// watcher below.
const options = createFinancialOptions(data, 'candlestick', props.rangeMinutes, onZoom);

onBeforeUnmount(() => {
    if (flush) cancelAnimationFrame(flush);
    flush = 0;
});

watch([() => props.bars, () => props.rangeMinutes, () => props.ticker], ([bars, rangeMinutes, ticker]) => {
    const chart = chartInstance();
    // Leave the mirror alone until there is an instance to apply the change to, so data the chart
    // never received cannot become the baseline the next transaction is built against.
    if (!chart) return;

    // One shared time grid means `time` (the dataIdKey) cannot diff one feed against another, and
    // the outgoing zoom may reach past the baseline window the incoming feed carries.
    if (ticker !== shownTicker) {
        shownTicker = ticker;
        shownRangeMinutes = rangeMinutes;
        live = true;
        data = bars.map(toDatum);
        const swapped = data;
        chart
            .updateDelta({ data: swapped })
            .then(() => applyRange(chart, swapped, rangeMinutes))
            .catch(logError);
        return;
    }

    const synced = live ? syncData(chart, data, bars) : Promise.resolve();

    // A range-button press is a zoom, applied once the chart holds any bars that arrived
    // alongside it. Pressed while held back, `stickToEnd` carries it forward on the flush.
    const rangeChanged = rangeMinutes !== shownRangeMinutes;
    shownRangeMinutes = rangeMinutes;
    const applied = rangeChanged ? synced.then(() => applyRange(chart, data, rangeMinutes)) : synced;
    applied.catch(logError);
});
</script>

<template>
    <AgFinancialCharts ref="chartComponent" :options="options" :style="{ height: '100%', width: '100%' }" />
</template>
