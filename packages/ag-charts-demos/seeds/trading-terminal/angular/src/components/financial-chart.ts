import {
    type AfterViewInit,
    Component,
    type OnDestroy,
    type OnInit,
    effect,
    input,
    output,
    untracked,
    viewChild,
} from '@angular/core';

import { AgFinancialCharts } from 'ag-charts-angular';
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

/**
 * The React `FinancialChart` renders only the `<AgFinancialCharts>`; here the component's host is
 * the `.fin-chart-body` div around it, so the rendered tree gains no element.
 */
@Component({
    selector: 'div[finFinancialChart]',
    imports: [AgFinancialCharts],
    host: { class: 'fin-chart-body' },
    template: '<ag-financial-charts style="display: block; height: 100%; width: 100%;" [options]="options" />',
})
export class FinancialChart implements OnInit, AfterViewInit, OnDestroy {
    readonly bars = input.required<Bar[]>();
    /** Visible trailing range in minutes; bars are one minute apart, so this is a bar count. */
    readonly rangeMinutes = input.required<number>();
    /** The instrument on show. A change swaps the whole series (see the effect below). */
    readonly ticker = input.required<string>();
    /**
     * Reports the oldest bar on screen (epoch ms), or `undefined` when the view is zoomed out and
     * has no range to protect. The feed keeps everything newer.
     */
    readonly retainFrom = output<number | undefined>();

    // Seeded once so the options reference stays stable: re-running the slow options path would also
    // clobber the toolbar's live chart-type selection. Later bars stream in via the effect below.
    protected options!: AgFinancialChartOptions;

    private readonly chartComponent = viewChild.required(AgFinancialCharts);
    private chart?: AgChartInstance;
    // OPTIMIZATION: the chart's data, mirrored and mutated in place so a tick touches only the
    // changed ends rather than rebuilding the whole (unbounded) history.
    private data: ChartDatum[] = [];
    // Tracks the range so a range-button press can be told apart from a streaming tick.
    private lastRangeMinutes = 0;
    // Likewise the instrument, so a selection can be told apart from a tick.
    private lastTicker = '';
    // Whether the view is watching the live edge. Away from it ticks are held back, since applying
    // one re-derives the zoom and creeps the pinned bars by a fraction of a pixel.
    private live = true;
    private flush = 0;

    constructor() {
        // The React effect on [bars, rangeMinutes, ticker].
        effect(() => {
            const bars = this.bars();
            const rangeMinutes = this.rangeMinutes();
            const ticker = this.ticker();
            untracked(() => this.sync(bars, rangeMinutes, ticker));
        });
    }

    ngOnInit(): void {
        const bars = this.bars();
        this.lastRangeMinutes = this.rangeMinutes();
        this.lastTicker = this.ticker();
        this.data = bars.map(toDatum);
        this.options = createFinancialOptions(this.data, 'candlestick', this.lastRangeMinutes, (event) =>
            this.onZoom(event)
        );
    }

    ngAfterViewInit(): void {
        // The wrapper creates the chart in its own ngAfterViewInit, which runs before this one.
        this.chart = this.chartComponent().chart;
    }

    ngOnDestroy(): void {
        if (this.flush) cancelAnimationFrame(this.flush);
        this.flush = 0;
    }

    private scheduleFlush(): void {
        if (this.flush) return;
        // Out of the update cycle that raised the zoom event, so the catch-up is not re-entrant.
        this.flush = requestAnimationFrame(() => {
            this.flush = 0;
            const chart = this.chart;
            if (!chart) return;
            syncData(chart, this.data, this.bars()).catch(logError);
        });
    }

    private onZoom(event: AgZoomEvent): void {
        const zoomedOut = event.ratioX.start <= 0 && event.ratioX.end >= 1;
        const start = zoomedOut ? undefined : rangeStartTime(event.rangeX);
        this.retainFrom.emit(start == null ? undefined : start - RETAIN_MARGIN_BARS * BAR_INTERVAL_MS);

        const wasLive = this.live;
        this.live = zoomedOut || event.ratioX.end >= LIVE_EDGE_RATIO;
        if (this.live && !wasLive) this.scheduleFlush();
    }

    private sync(bars: Bar[], rangeMinutes: number, ticker: string): void {
        const chart = this.chart;
        // Leave the mirrors alone until there is an instance to apply the change to, so data the chart
        // never received cannot become the baseline the next transaction is built against.
        if (!chart) return;

        // One shared time grid means `time` (the dataIdKey) cannot diff one feed against another, and
        // the outgoing zoom may reach past the baseline window the incoming feed carries.
        if (ticker !== this.lastTicker) {
            this.lastTicker = ticker;
            this.lastRangeMinutes = rangeMinutes;
            this.live = true;
            const data = bars.map(toDatum);
            this.data = data;
            chart
                .updateDelta({ data })
                .then(() => applyRange(chart, data, rangeMinutes))
                .catch(logError);
            return;
        }

        const synced = this.live ? syncData(chart, this.data, bars) : Promise.resolve();

        // A range-button press is a zoom, applied once the chart holds any bars that arrived
        // alongside it. Pressed while held back, `stickToEnd` carries it forward on the flush.
        const rangeChanged = rangeMinutes !== this.lastRangeMinutes;
        this.lastRangeMinutes = rangeMinutes;
        const applied = rangeChanged ? synced.then(() => applyRange(chart, this.data, rangeMinutes)) : synced;
        applied.catch(logError);
    }
}
