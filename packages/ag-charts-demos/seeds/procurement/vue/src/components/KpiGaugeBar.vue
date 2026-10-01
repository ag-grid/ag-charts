<script lang="ts">
import { type AgLinearGaugeOptions } from 'ag-charts-enterprise';

import { THEME } from '../chartTheme';
import type { Kpi, KpiGauge } from '../types';

/** Bar ink per threshold state, matching the tile's own accent. */
const GAUGE_FILL: Record<Kpi['tone'], string> = {
    neutral: 'var(--pc-accent)',
    good: 'var(--pc-ok-fill)',
    warn: 'var(--pc-warn-fill)',
    bad: 'var(--pc-bad-fill)',
};

/**
 * The tile's figure against the thing it is measured against.
 *
 * A percentage says where she is; only the marker says whether that is where she should be, and at
 * a glance the gap between bar and marker is the reading — which is the question these two tiles
 * exist to answer.
 */
function gaugeOptions({ value, target, targetLabel }: KpiGauge, tone: Kpi['tone']): AgLinearGaugeOptions {
    // The scale runs past the target: clamped to it, an overrun would land on the marker and read as on plan.
    const max = Math.max(100, Math.ceil(value * 100));

    return {
        theme: THEME,
        type: 'linear-gauge',
        direction: 'horizontal',
        value: value * 100,
        thickness: 8,
        cornerRadius: 4,
        scale: {
            min: 0,
            max,
            fill: 'var(--pc-grid)',
            // The figure above the gauge is the number; ticks here would only repeat it.
            label: { enabled: false },
        },
        bar: { fill: GAUGE_FILL[tone] },
        targets: [
            {
                value: target * 100,
                text: targetLabel,
                shape: 'line',
                placement: 'middle',
                size: 14,
                strokeWidth: 2,
                stroke: 'var(--pc-text)',
            },
        ],
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

import { AgGauge } from 'ag-charts-vue3';

const props = defineProps<{ gauge: KpiGauge; tone: Kpi['tone'] }>();

const options = computed(() => gaugeOptions(props.gauge, props.tone));
</script>

<template>
    <!-- The detail line already states the figure and its target, so the gauge stays out of accessible text. -->
    <span class="pc-kpi-gauge" aria-hidden="true">
        <AgGauge :options="options" :style="{ height: '100%', width: '100%' }" />
    </span>
</template>
