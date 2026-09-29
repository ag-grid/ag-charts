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
import {
    type AgCartesianChartOptions,
    type AgChartInstance,
    type AgColorScale,
    type AgHeatmapSeriesOptions,
} from 'ag-charts-community';

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

// Module-scope so the series identity is stable across renders — a fresh identity per tick
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

/**
 * The React component's root `.fin-detail-card` is this component's host. FinancialApp remounts it
 * on every ticker change (the React `key`), so `instrument` never changes within one instance.
 */
@Component({
    selector: 'div[finPeerSpreadHeatmap]',
    imports: [AgCharts],
    host: { class: 'fin-detail-card' },
    template: `
        <div class="fin-detail-card-title">Price spread across peers</div>
        <div class="fin-detail-chart">
            <ag-charts style="display: block; height: 100%; width: 100%;" [options]="options" />
        </div>
    `,
})
export class PeerSpreadHeatmap implements OnInit, AfterViewInit {
    readonly instrument = input.required<Instrument>();
    readonly peerFeed = input.required<PeerPerformanceFeed>();
    /** Bumped every stream tick so the live buckets recompute. */
    readonly peerTick = input.required<number>();
    /** Trailing window in one-minute buckets; shared across charts. */
    readonly windowMinutes = input.required<number>();

    protected options!: AgCartesianChartOptions;

    private readonly chartComponent = viewChild.required(AgCharts);
    private chart?: AgChartInstance;
    private readonly peers = computed(() => sectorPeers(this.instrument().ticker));
    private readonly data = computed(() => {
        // peerTick is the recompute signal: the feed mutates in place.
        this.peerTick();
        return this.peerFeed().rollingSpread(this.peers(), this.windowMinutes());
    });
    // The cells currently rendered, diffed against each new window for the transaction.
    private window: PeerHeatmapCell[] = [];
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
        this.window = data;
        this.lastWindowMinutes = this.windowMinutes();
        // Seeded once; later buckets stream in via applyTransaction below.
        this.options = {
            theme: THEME,
            data,
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
    }

    ngAfterViewInit(): void {
        this.chart = this.chartComponent().chart;
    }

    private sync(data: PeerHeatmapCell[], windowMinutes: number): void {
        const baseline = this.window;
        this.window = data;
        // A resize swaps most buckets at once; incremental transactions would leave the category
        // axis domain stale, so replace the data to rebuild it. Ticks stay incremental below.
        if (windowMinutes !== this.lastWindowMinutes) {
            this.lastWindowMinutes = windowMinutes;
            this.chart?.updateDelta({ data }).catch(logError);
            return;
        }
        const transactions = diffWindow(
            baseline,
            data,
            (cell) => cell.key,
            (a, b) => a.value === b.value
        );
        for (const transaction of transactions) {
            this.chart?.applyTransaction(transaction).catch(logError);
        }
    }
}
