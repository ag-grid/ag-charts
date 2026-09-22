<script setup lang="ts">
import DemoInfo from './DemoInfo.vue';

// A fixed demo balance. Static on purpose: nothing in the demo places a trade, so a
// drifting balance would imply state that does not exist.
const DEMO_FUNDS = '$1,000.00';
</script>

<template>
    <div class="fin-toolbar">
        <span class="fin-brand">
            <!-- The 20-unit viewBox maps 1:1 to the rendered size, so every edge lands on a device pixel. -->
            <svg class="fin-brand-mark" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <rect class="fin-brand-mark-badge" width="20" height="20" />
                <g class="fin-brand-mark-glyph">
                    <rect x="5" y="4" width="2" height="14" />
                    <rect x="3" y="8" width="6" height="6" />
                    <rect x="13" y="2" width="2" height="14" />
                    <rect x="11" y="5" width="6" height="6" />
                </g>
            </svg>
            AG Trade
        </span>

        <div class="fin-toolbar-spacer" />

        <span class="fin-account">
            <span class="fin-account-label">Funds</span>
            <span class="fin-account-value">{{ DEMO_FUNDS }}</span>
        </span>
        <DemoInfo />
    </div>
</template>
