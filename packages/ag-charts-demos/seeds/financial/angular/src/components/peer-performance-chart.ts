import {
    type AfterViewInit,
    Component,
    type OnInit,
    computed,
    effect,
    input,
    untracked,
    viewChild,
} from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import { type AgCartesianChartOptions, type AgChartInstance, type AgLineSeriesOptions } from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { type Instrument, type PeerPerformanceFeed, type PerfRow, sectorPeers } from '../data';
import { diffWindow } from '../windowTransaction';

// Module-scope keeps these identities stable across renders; a fresh function per tick would force the
// chart's full options processing instead of the data-only fast path.
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

/**
 * The React component's root `.fin-detail-card` is this component's host. FinancialApp remounts it
 * on every ticker change (the React `key`), so `instrument` never changes within one instance.
 */
@Component({
    selector: 'div[finPeerPerformanceChart]',
    imports: [AgCharts],
    host: { class: 'fin-detail-card' },
    template: `
        <div class="fin-detail-card-title">Peer performance vs S&amp;P 500</div>
        <div class="fin-detail-chart">
            <ag-charts style="display: block; height: 100%; width: 100%;" [options]="options" />
        </div>
    `,
})
export class PeerPerformanceChart implements OnInit, AfterViewInit {
    readonly instrument = input.required<Instrument>();
    readonly peerFeed = input.required<PeerPerformanceFeed>();
    /** Bumped every stream tick so the live window recomputes. */
    readonly peerTick = input.required<number>();
    /** Trailing window in points (one point per bar interval, 1 min); shared across charts. */
    readonly windowMinutes = input.required<number>();

    protected options!: AgCartesianChartOptions;

    private readonly chartComponent = viewChild.required(AgCharts);
    private chart?: AgChartInstance;
    private readonly peers = computed(() => sectorPeers(this.instrument().ticker));
    private readonly data = computed(() => {
        // peerTick is the recompute signal: the feed mutates in place, so its own
        // reference never changes when a new point streams in.
        this.peerTick();
        return this.peerFeed().relativePerformance(this.peers(), this.windowMinutes());
    });
    // The rows currently rendered, diffed against each new window for the transaction.
    private window: PerfRow[] = [];
    // Tracks the window size so a resize can be told apart from a streaming tick.
    private lastWindowMinutes = 0;

    constructor() {
        // The React effect on [data, windowMinutes].
        effect(() => {
            const data = this.data();
            const windowMinutes = this.windowMinutes();
            untracked(() => this.sync(data, windowMinutes));
        });
    }

    ngOnInit(): void {
        const data = this.data();
        const selected = this.instrument().ticker;
        this.window = data;
        this.lastWindowMinutes = this.windowMinutes();
        const series: AgLineSeriesOptions[] = this.peers().map((ticker) => ({
            type: 'line',
            xKey: 'date',
            yKey: ticker,
            yName: ticker,
            // Emphasise the selected company against its peers via stroke width only.
            strokeWidth: ticker === selected ? 3 : 1,
            strokeOpacity: ticker === selected ? 1 : 0.5,
            marker: { enabled: false },
            tooltip: { renderer: PEER_TOOLTIP_RENDERER },
        }));
        // Seeded once; later windows stream in via applyTransaction below.
        this.options = {
            theme: THEME,
            data,
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
    }

    ngAfterViewInit(): void {
        this.chart = this.chartComponent().chart;
    }

    private sync(data: PerfRow[], windowMinutes: number): void {
        const baseline = this.window;
        this.window = data;
        // A resize swaps most of the window at once; incremental transactions would leave the
        // ordinal-time axis domain stale, so replace the data to rebuild it. Ticks stay incremental below.
        if (windowMinutes !== this.lastWindowMinutes) {
            this.lastWindowMinutes = windowMinutes;
            this.chart?.updateDelta({ data }).catch(logError);
            return;
        }
        const transactions = diffWindow(baseline, data, (row) => row.id);
        for (const transaction of transactions) {
            this.chart?.applyTransaction(transaction).catch(logError);
        }
    }
}
