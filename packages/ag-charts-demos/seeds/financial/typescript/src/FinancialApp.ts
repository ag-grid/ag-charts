import { type FinancialChart, createFinancialChart } from './components/FinancialChart';
import { createMostActive } from './components/MostActive';
import { type PeerPerformanceChart, createPeerPerformanceChart } from './components/PeerPerformanceChart';
import { type PeerSpreadHeatmap, createPeerSpreadHeatmap } from './components/PeerSpreadHeatmap';
import { createProfileGauges } from './components/ProfileGauges';
import { tickerBadge } from './components/TickerCell';
import { createToolbar } from './components/Toolbar';
import { createTrending } from './components/Trending';
import { createWatchlist } from './components/Watchlist';
import { type View, h } from './dom';
import { fmtPrice } from './format';
import { createStreamingMarket } from './streamingMarket';
import { button, createSelect, createToggleGroup } from './ui';

// Stream speeds — a fast desk wants to dial the cadence up or down.
const SPEED_OPTIONS = [
    { value: '1000', label: '1×' },
    { value: '500', label: '2×' },
    { value: '250', label: '4×' },
];

// Shared default visible range (minutes), driven by the title-bar range buttons: zoom state for the
// financial chart, a data window for PeerPerformance and the peer heatmap (one bucket per minute).
const SHARED_WINDOW_MINUTES = 120;

// Range-button choices for the shared time window, in trailing minutes.
const RANGE_OPTIONS = [
    { value: '30', label: '30m' },
    { value: '60', label: '1H' },
    { value: '120', label: '2H' },
    { value: '240', label: '4H' },
];

/**
 * The FinancialApp component as a mountable view. The React component re-renders on every state
 * change; here `render()` runs on every change and each child's `update()` applies what its React
 * effects would.
 */
export function createFinancialApp(): View {
    const market = createStreamingMarket();
    // Shared trailing range (minutes) driven by the title-bar range buttons.
    let rangeMinutes = SHARED_WINDOW_MINUTES;
    // Off-canvas watchlist drawer; only reachable on narrow viewports.
    let drawerOpen = false;

    const setDrawerOpen = (open: boolean) => {
        drawerOpen = open;
        render();
    };

    // Selecting an instrument on a phone should reveal the chart it opened.
    const openInstrument = (next: string) => {
        drawerOpen = false;
        // Notifies, which renders.
        market.selectTicker(next);
    };

    const state = market.getState();

    const watchlist = createWatchlist({ quotes: state.quotes, activeTicker: state.ticker, onSelect: openInstrument });
    const trending = createTrending({ rows: state.trending, activeTicker: state.ticker, onSelect: openInstrument });
    const mostActive = createMostActive({
        rows: state.mostActive,
        activeTicker: state.ticker,
        onSelect: openInstrument,
    });

    // Title-bar quote: the badge is swapped when the instrument changes, the texts updated in place.
    let badge = tickerBadge(state.instrument.ticker);
    let badgeTicker = state.ticker;
    const quoteSymbol = h('span', { class: 'fin-quote-symbol' });
    const quotePrice = h('span', { class: 'fin-quote-price' });
    const quoteChange = h('span');
    const quote = h('div', { class: 'fin-quote' }, badge, quoteSymbol, quotePrice, quoteChange);

    const rangeGroup = createToggleGroup({
        ariaLabel: 'Time range',
        value: String(rangeMinutes),
        onValueChange: (value) => {
            rangeMinutes = Number(value);
            render();
        },
        options: RANGE_OPTIONS,
    });
    const speedSelect = createSelect({
        label: 'Speed',
        ariaLabel: 'Stream speed',
        value: String(state.speedMs),
        onValueChange: (value) => market.setSpeedMs(Number(value)),
        options: SPEED_OPTIONS,
    });
    const liveButton = button({ onclick: () => market.setRunning(!market.getState().running) });

    const financialChart: FinancialChart = createFinancialChart({
        bars: state.bars,
        rangeMinutes,
        ticker: state.ticker,
        onRetainFrom: market.setRetainFrom,
    });
    const gauges = createProfileGauges(state.metrics);

    // Keyed on the ticker in React: a selection replaces both with fresh instances.
    let peerTicker = state.ticker;
    let peerChart: PeerPerformanceChart = createPeerPerformanceChart({
        instrument: state.instrument,
        peerFeed: market.peerFeed,
        peerTick: state.peerTick,
        windowMinutes: rangeMinutes,
    });
    let heatmap: PeerSpreadHeatmap = createPeerSpreadHeatmap({
        instrument: state.instrument,
        peerFeed: market.peerFeed,
        peerTick: state.peerTick,
        windowMinutes: rangeMinutes,
    });
    const detailCharts = h('div', { class: 'fin-detail-charts' }, peerChart.el, heatmap.el);

    const body = h(
        'div',
        { class: 'fin-body', 'data-drawer-open': 'false' },
        h('div', { class: 'fin-sidebar fin-sidebar-left' }, watchlist.el, trending.el, mostActive.el),
        h('div', { class: 'fin-drawer-overlay', onclick: () => setDrawerOpen(false) }),
        h(
            'div',
            { class: 'fin-main' },
            h(
                'div',
                { class: 'fin-title-bar' },
                h(
                    'div',
                    { class: 'fin-title-left' },
                    button(
                        {
                            class: 'fin-drawer-toggle',
                            'aria-label': 'Open watchlist',
                            onclick: () => setDrawerOpen(true),
                        },
                        '☰'
                    ),
                    quote
                ),
                h('div', { class: 'fin-title-controls' }, rangeGroup.el, speedSelect.el, liveButton)
            ),
            h(
                'div',
                { class: 'fin-detail-card fin-chart-card' },
                h('div', { class: 'fin-chart-body' }, financialChart.el)
            ),
            gauges.el,
            detailCharts
        )
    );
    const el = h('div', { class: 'fin-container' }, createToolbar(), body);

    let mounted = false;

    function render() {
        const {
            instrument,
            bars,
            quotes,
            metrics,
            trending: trendingRows,
            mostActive: mostActiveRows,
        } = market.getState();
        const { peerTick, ticker, running, speedMs } = market.getState();

        body.setAttribute('data-drawer-open', String(drawerOpen));

        const last = bars[bars.length - 1];
        const first = bars[0];
        const change = last && first ? last.close - first.open : 0;
        const changePct = last && first ? (change / first.open) * 100 : 0;
        if (ticker !== badgeTicker) {
            badgeTicker = ticker;
            const next = tickerBadge(instrument.ticker);
            badge.replaceWith(next);
            badge = next;
        }
        quoteSymbol.textContent = instrument.name;
        quotePrice.textContent = last ? fmtPrice(last.close) : '—';
        quoteChange.className = change >= 0 ? 'fin-up' : 'fin-down';
        quoteChange.textContent = `${change >= 0 ? '▲' : '▼'} ${fmtPrice(Math.abs(change))} (${changePct.toFixed(2)}%)`;

        rangeGroup.setValue(String(rangeMinutes));
        speedSelect.setValue(String(speedMs));
        liveButton.textContent = running ? '❚❚ Pause' : '▶ Live';

        watchlist.update({ rowData: quotes, activeTicker: ticker });
        trending.update({ rowData: trendingRows, activeTicker: ticker });
        mostActive.update({ rowData: mostActiveRows, activeTicker: ticker });

        financialChart.update({ bars, rangeMinutes, ticker });
        gauges.update(metrics);

        if (ticker !== peerTicker) {
            peerTicker = ticker;
            peerChart.destroy();
            heatmap.destroy();
            const props = { instrument, peerFeed: market.peerFeed, peerTick, windowMinutes: rangeMinutes };
            const nextPeerChart = createPeerPerformanceChart(props);
            const nextHeatmap = createPeerSpreadHeatmap(props);
            peerChart.el.replaceWith(nextPeerChart.el);
            heatmap.el.replaceWith(nextHeatmap.el);
            peerChart = nextPeerChart;
            heatmap = nextHeatmap;
            if (mounted) {
                peerChart.mount();
                heatmap.mount();
            }
        } else {
            peerChart.update({ peerTick, windowMinutes: rangeMinutes });
            heatmap.update({ peerTick, windowMinutes: rangeMinutes });
        }
    }
    render();
    const unsubscribe = market.subscribe(render);

    return {
        el,
        mount() {
            mounted = true;
            for (const view of [watchlist, trending, mostActive, financialChart, gauges, peerChart, heatmap]) {
                view.mount();
            }
        },
        destroy() {
            unsubscribe();
            market.setRunning(false);
            for (const view of [watchlist, trending, mostActive, financialChart, gauges, peerChart, heatmap]) {
                view.destroy();
            }
        },
    };
}
