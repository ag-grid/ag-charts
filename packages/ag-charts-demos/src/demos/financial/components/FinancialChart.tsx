import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
    type AgChartInstance,
    type AgContextMenuGetItemsCallback,
    type AgFinancialChartOptions,
    type AgZoomEvent,
} from 'ag-charts-community';
import { AgFinancialCharts } from 'ag-charts-react';

import { diffBars, toDatum } from '../barTransaction';
import { THEME } from '../chartTheme';
import { BAR_INTERVAL_MS, type Bar } from '../data';
import { type ChartDatum } from '../types';

// Scoped to this chart: the preset omits `padding`, `zoom` and `contextMenu` from its option types,
// so the theme is the only lever, and the other charts on the page keep the defaults.
const financialTheme = (getItems: AgContextMenuGetItemsCallback<ChartDatum, never>) => ({
    ...THEME,
    overrides: {
        ...THEME.overrides,
        common: {
            ...THEME.overrides.common,
            padding: {
                top: 8,
                right: 12,
            },
            // The default view is itself a zoom, so a built-in reset always has something to undo and
            // bounces off the full domain. Both of its entry points route to `resetToRange` instead.
            zoom: {
                enableDoubleClickToReset: false,
            },
            contextMenu: {
                getItems,
            },
        },
    },
});

// Slack when pinning history, so the bar on the boundary is never the one the feed drops.
const RETAIN_MARGIN_BARS = 2;
// A view this close to the newest bar counts as watching the live edge.
const LIVE_EDGE_RATIO = 1 - 1e-6;
// Matches `contextMenuResetZoom`, the label on the item this chart replaces.
const RESET_ZOOM_LABEL = 'Reset zoom';

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);

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

function applyRange(chart: AgChartInstance, data: ChartDatum[], rangeMinutes: number) {
    return chart.setState({ ...chart.getState(), zoom: rangeStart(data, rangeMinutes) });
}

/**
 * Bring the chart's data up to date with the feed's window, resolving once the chart holds it: a
 * range measured off the mirror but applied against the pre-transaction domain would be clamped.
 */
function syncData(chart: AgChartInstance, data: ChartDatum[], bars: Bar[]): Promise<void> {
    const transaction = diffBars(data, bars);
    return transaction ? chart.applyTransaction(transaction) : Promise.resolve();
}

function createFinancialOptions(
    data: ChartDatum[],
    chartType: AgFinancialChartOptions['chartType'],
    rangeMinutes: number,
    onZoom: (event: AgZoomEvent) => void,
    onDoubleClick: () => void,
    getContextMenuItems: AgContextMenuGetItemsCallback<ChartDatum, never>
): AgFinancialChartOptions {
    return {
        theme: financialTheme(getContextMenuItems),
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
        listeners: { zoom: onZoom, doubleClick: onDoubleClick },
    } as AgFinancialChartOptions;
}

interface FinancialChartProps {
    bars: Bar[];
    /** Visible trailing range in minutes; bars are one minute apart, so this is a bar count. */
    rangeMinutes: number;
    /** The instrument on show. A change swaps the whole series (see the effect below). */
    ticker: string;
    /**
     * Reports the oldest bar on screen (epoch ms), or `undefined` when the view is zoomed out and
     * has no range to protect. The feed keeps everything newer.
     */
    onRetainFrom: (time?: number) => void;
}

export function FinancialChart({ bars, rangeMinutes, ticker, onRetainFrom }: FinancialChartProps) {
    const chartRef = useRef<AgChartInstance>(null);
    // OPTIMIZATION: the chart's data, mirrored and mutated in place so a tick touches only the
    // changed ends rather than rebuilding the whole (unbounded) history.
    const dataRef = useRef<ChartDatum[]>([]);
    // Tracks the range so a range-button press can be told apart from a streaming tick.
    const rangeMinutesRef = useRef(rangeMinutes);
    // Likewise the instrument, so a selection can be told apart from a tick.
    const tickerRef = useRef(ticker);
    // Whether the view is watching the live edge. Away from it ticks are held back, since applying
    // one re-derives the zoom and creeps the pinned bars by a fraction of a pixel.
    const liveRef = useRef(true);
    const flushRef = useRef(0);
    const resetRangeRef = useRef(false);
    // The oldest bar on screen, to tell the range view apart from any other view of it.
    const viewStartRef = useRef<number>();
    // The zoom listener and the rAF flush both outlive the render that created them.
    const propsRef = useRef({ bars, rangeMinutes, onRetainFrom });
    propsRef.current = { bars, rangeMinutes, onRetainFrom };

    const scheduleFlush = useCallback((reapplyRange: boolean) => {
        resetRangeRef.current ||= reapplyRange;
        if (flushRef.current) return;
        // Out of the update cycle that raised the zoom event, so the catch-up is not re-entrant.
        flushRef.current = requestAnimationFrame(() => {
            flushRef.current = 0;
            const reset = resetRangeRef.current;
            resetRangeRef.current = false;
            const chart = chartRef.current;
            if (!chart) return;
            syncData(chart, dataRef.current, propsRef.current.bars)
                .then(() => (reset ? applyRange(chart, dataRef.current, propsRef.current.rangeMinutes) : undefined))
                .catch(logError);
        });
    }, []);

    const onZoom = useCallback(
        (event: AgZoomEvent) => {
            const zoomedOut = event.ratioX.start <= 0 && event.ratioX.end >= 1;
            const start = zoomedOut ? undefined : rangeStartTime(event.rangeX);
            propsRef.current.onRetainFrom(start == null ? undefined : start - RETAIN_MARGIN_BARS * BAR_INTERVAL_MS);

            viewStartRef.current = start;
            const wasLive = liveRef.current;
            liveRef.current = zoomedOut || event.ratioX.end >= LIVE_EDGE_RATIO;
            // Reset means "back to the live range" here: rendering the whole pinned history instead
            // would snap back to the baseline window as soon as the feed evicted it.
            const reset = zoomedOut && dataRef.current.length > propsRef.current.rangeMinutes;
            if (reset || (liveRef.current && !wasLive)) scheduleFlush(reset);
        },
        [scheduleFlush]
    );

    // Whether the view is already the one the range buttons define, and so has nothing to reset to.
    const isRangeView = useCallback(() => {
        const data = dataRef.current;
        const target = data[Math.max(0, data.length - propsRef.current.rangeMinutes)]?.time;
        const showing = viewStartRef.current;
        return liveRef.current && target != null && showing != null && Math.abs(showing - target) < BAR_INTERVAL_MS;
    }, []);

    const resetToRange = useCallback(() => {
        if (isRangeView()) return;
        liveRef.current = true;
        scheduleFlush(true);
    }, [isRangeView, scheduleFlush]);

    // Swap the built-in reset for one that lands on the range view, keeping its label and its habit
    // of greying out when the view it restores is already on screen.
    const getContextMenuItems = useCallback<AgContextMenuGetItemsCallback<ChartDatum, never>>(
        ({ defaultItems }) =>
            defaultItems.map((item) =>
                item === 'reset-zoom'
                    ? { label: RESET_ZOOM_LABEL, enabled: !isRangeView(), action: resetToRange }
                    : item
            ),
        [isRangeView, resetToRange]
    );

    // Seeded once so the options reference stays stable: re-running the slow options path would also
    // clobber the toolbar's live chart-type selection. Later bars stream in via the effect below.
    const options = useMemo(() => {
        dataRef.current = bars.map(toDatum);
        return createFinancialOptions(
            dataRef.current,
            'candlestick',
            rangeMinutes,
            onZoom,
            resetToRange,
            getContextMenuItems
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        return () => {
            if (flushRef.current) cancelAnimationFrame(flushRef.current);
            flushRef.current = 0;
        };
    }, []);

    useEffect(() => {
        const chart = chartRef.current;
        // Leave the refs alone until there is an instance to apply the change to, so data the chart
        // never received cannot become the baseline the next transaction is built against.
        if (!chart) return;

        // One shared time grid means `time` (the dataIdKey) cannot diff one feed against another, and
        // the outgoing zoom may reach past the baseline window the incoming feed carries.
        if (ticker !== tickerRef.current) {
            tickerRef.current = ticker;
            rangeMinutesRef.current = rangeMinutes;
            liveRef.current = true;
            const data = bars.map(toDatum);
            dataRef.current = data;
            chart
                .updateDelta({ data })
                .then(() => applyRange(chart, data, rangeMinutes))
                .catch(logError);
            return;
        }

        const synced = liveRef.current ? syncData(chart, dataRef.current, bars) : Promise.resolve();

        // A range-button press is a zoom, applied once the chart holds any bars that arrived
        // alongside it. Pressed while held back, `stickToEnd` carries it forward on the flush.
        const rangeChanged = rangeMinutes !== rangeMinutesRef.current;
        rangeMinutesRef.current = rangeMinutes;
        const applied = rangeChanged ? synced.then(() => applyRange(chart, dataRef.current, rangeMinutes)) : synced;
        applied.catch(logError);
    }, [bars, rangeMinutes, ticker]);

    return <AgFinancialCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
