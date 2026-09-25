import { type AgChartInstance, AgCharts, type AgFinancialChartOptions, type AgZoomEvent } from 'ag-charts-community';

import { diffBars, toDatum } from '../barTransaction';
import { THEME } from '../chartTheme';
import { BAR_INTERVAL_MS, type Bar } from '../data';
import { type View, h } from '../dom';
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
    container: HTMLElement,
    data: ChartDatum[],
    chartType: AgFinancialChartOptions['chartType'],
    rangeMinutes: number,
    onZoom: (event: AgZoomEvent) => void
): AgFinancialChartOptions {
    return {
        container,
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

interface FinancialChartProps {
    bars: Bar[];
    /** Visible trailing range in minutes; bars are one minute apart, so this is a bar count. */
    rangeMinutes: number;
    /** The instrument on show. A change swaps the whole series (see `update`). */
    ticker: string;
    /**
     * Reports the oldest bar on screen (epoch ms), or `undefined` when the view is zoomed out and
     * has no range to protect. The feed keeps everything newer.
     */
    onRetainFrom: (time?: number) => void;
}

export interface FinancialChart extends View {
    update(props: Pick<FinancialChartProps, 'bars' | 'rangeMinutes' | 'ticker'>): void;
}

export function createFinancialChart(initial: FinancialChartProps): FinancialChart {
    // The div ag-charts-react renders for the chart, sized by its `style` prop.
    const el = h('div', { style: 'height: 100%; width: 100%;' });
    let chart: FinancialChartInstance | undefined;
    // The latest props, read by the zoom listener and the animation-frame flush.
    let props = initial;
    // OPTIMIZATION: the chart's data, mirrored and mutated in place so a tick touches only the
    // changed ends rather than rebuilding the whole (unbounded) history.
    let data: ChartDatum[] = initial.bars.map(toDatum);
    // Tracks the range so a range-button press can be told apart from a streaming tick.
    let lastRangeMinutes = initial.rangeMinutes;
    // Likewise the instrument, so a selection can be told apart from a tick.
    let lastTicker = initial.ticker;
    // Whether the view is watching the live edge. Away from it ticks are held back, since applying
    // one re-derives the zoom and creeps the pinned bars by a fraction of a pixel.
    let live = true;
    let flushId = 0;

    const scheduleFlush = () => {
        if (flushId) return;
        // Out of the update cycle that raised the zoom event, so the catch-up is not re-entrant.
        flushId = requestAnimationFrame(() => {
            flushId = 0;
            if (!chart) return;
            syncData(chart, data, props.bars).catch(logError);
        });
    };

    const onZoom = (event: AgZoomEvent) => {
        const zoomedOut = event.ratioX.start <= 0 && event.ratioX.end >= 1;
        const start = zoomedOut ? undefined : rangeStartTime(event.rangeX);
        props.onRetainFrom(start == null ? undefined : start - RETAIN_MARGIN_BARS * BAR_INTERVAL_MS);

        const wasLive = live;
        live = zoomedOut || event.ratioX.end >= LIVE_EDGE_RATIO;
        if (live && !wasLive) scheduleFlush();
    };

    return {
        el,
        mount() {
            // Seeded once; later bars stream in via `update`. Re-running the slow options path would
            // also clobber the toolbar's live chart-type selection.
            chart = AgCharts.createFinancialChart(
                createFinancialOptions(el, data, 'candlestick', initial.rangeMinutes, onZoom)
            );
        },
        update({ bars, rangeMinutes, ticker }) {
            props = { ...props, bars, rangeMinutes, ticker };
            // Leave the mirror alone until there is an instance to apply the change to, so data the
            // chart never received cannot become the baseline the next transaction is built against.
            if (!chart) return;

            // One shared time grid means `time` (the dataIdKey) cannot diff one feed against another, and
            // the outgoing zoom may reach past the baseline window the incoming feed carries.
            if (ticker !== lastTicker) {
                lastTicker = ticker;
                lastRangeMinutes = rangeMinutes;
                live = true;
                data = bars.map(toDatum);
                const swapped = data;
                const instance = chart;
                instance
                    .updateDelta({ data: swapped })
                    .then(() => applyRange(instance, swapped, rangeMinutes))
                    .catch(logError);
                return;
            }

            const synced = live ? syncData(chart, data, bars) : Promise.resolve();

            // A range-button press is a zoom, applied once the chart holds any bars that arrived
            // alongside it. Pressed while held back, `stickToEnd` carries it forward on the flush.
            const rangeChanged = rangeMinutes !== lastRangeMinutes;
            lastRangeMinutes = rangeMinutes;
            const instance = chart;
            const applied = rangeChanged ? synced.then(() => applyRange(instance, data, rangeMinutes)) : synced;
            applied.catch(logError);
        },
        destroy() {
            if (flushId) cancelAnimationFrame(flushId);
            flushId = 0;
            chart?.destroy();
            chart = undefined;
        },
    };
}
