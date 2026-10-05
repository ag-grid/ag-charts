<script setup lang="ts">
import { computed, ref } from 'vue';

import FinancialChart from './components/FinancialChart.vue';
import MostActive from './components/MostActive.vue';
import PeerPerformanceChart from './components/PeerPerformanceChart.vue';
import PeerSpreadHeatmap from './components/PeerSpreadHeatmap.vue';
import ProfileGauges from './components/ProfileGauges.vue';
import TickerBadge from './components/TickerBadge.vue';
import Toolbar from './components/Toolbar.vue';
import Trending from './components/Trending.vue';
import Watchlist from './components/Watchlist.vue';
import { fmtPrice } from './format';
import Button from './ui/Button.vue';
import Select from './ui/Select.vue';
import ToggleGroup from './ui/ToggleGroup.vue';
import { useStreamingMarket } from './useStreamingMarket';

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

const {
    instrument,
    bars,
    quotes,
    metrics,
    trending,
    mostActive,
    peerFeed,
    peerTick,
    ticker,
    selectTicker,
    setRetainFrom,
    running,
    speedMs,
} = useStreamingMarket();

// Shared trailing range (minutes) driven by the title-bar range buttons.
const rangeMinutes = ref(SHARED_WINDOW_MINUTES);
// Off-canvas watchlist drawer; only reachable on narrow viewports.
const drawerOpen = ref(false);

// The controls speak option values (strings); the state is numeric.
const rangeValue = computed({
    get: () => String(rangeMinutes.value),
    set: (value: string) => {
        rangeMinutes.value = Number(value);
    },
});
const speedValue = computed({
    get: () => String(speedMs.value),
    set: (value: string) => {
        speedMs.value = Number(value);
    },
});

// Selecting an instrument on a phone should reveal the chart it opened.
function openInstrument(next: string) {
    selectTicker(next);
    drawerOpen.value = false;
}

const last = computed(() => bars.value[bars.value.length - 1]);
const first = computed(() => bars.value[0]);
const change = computed(() => (last.value && first.value ? last.value.close - first.value.open : 0));
const changePct = computed(() => (last.value && first.value ? (change.value / first.value.open) * 100 : 0));
</script>

<template>
    <div class="fin-container">
        <Toolbar />

        <div class="fin-body" :data-drawer-open="drawerOpen">
            <div class="fin-sidebar fin-sidebar-left">
                <Watchlist :quotes="quotes" :active-ticker="ticker" @select="openInstrument" />
                <Trending :rows="trending" :active-ticker="ticker" @select="openInstrument" />
                <MostActive :rows="mostActive" :active-ticker="ticker" @select="openInstrument" />
            </div>
            <div class="fin-drawer-overlay" @click="drawerOpen = false" />

            <div class="fin-main">
                <div class="fin-title-bar">
                    <div class="fin-title-left">
                        <Button class="fin-drawer-toggle" aria-label="Open watchlist" @click="drawerOpen = true">
                            ☰
                        </Button>
                        <div class="fin-quote">
                            <TickerBadge :ticker="instrument.ticker" />
                            <span class="fin-quote-symbol">{{ instrument.name }}</span>
                            <span class="fin-quote-price">{{ last ? fmtPrice(last.close) : '—' }}</span>
                            <span
                                :class="change >= 0 ? 'fin-up' : 'fin-down'"
                                v-text="
                                    `${change >= 0 ? '▲' : '▼'} ${fmtPrice(Math.abs(change))} (${changePct.toFixed(2)}%)`
                                "
                            />
                        </div>
                    </div>
                    <div class="fin-title-controls">
                        <ToggleGroup v-model="rangeValue" aria-label="Time range" :options="RANGE_OPTIONS" />
                        <Select v-model="speedValue" label="Speed" aria-label="Stream speed" :options="SPEED_OPTIONS" />
                        <Button @click="running = !running">{{ running ? '❚❚ Pause' : '▶ Live' }}</Button>
                    </div>
                </div>
                <div class="fin-detail-card fin-chart-card">
                    <div class="fin-chart-body">
                        <FinancialChart
                            :bars="bars"
                            :range-minutes="rangeMinutes"
                            :ticker="ticker"
                            @retain-from="setRetainFrom"
                        />
                    </div>
                </div>

                <ProfileGauges :metrics="metrics" />

                <div class="fin-detail-charts">
                    <PeerPerformanceChart
                        :key="`peer-${ticker}`"
                        :instrument="instrument"
                        :peer-feed="peerFeed"
                        :peer-tick="peerTick"
                        :window-minutes="rangeMinutes"
                    />
                    <PeerSpreadHeatmap
                        :key="`heatmap-${ticker}`"
                        :instrument="instrument"
                        :peer-feed="peerFeed"
                        :peer-tick="peerTick"
                        :window-minutes="rangeMinutes"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
