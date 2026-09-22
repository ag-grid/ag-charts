<script lang="ts">
import type { DailyPoint, summary } from '../data';
import { METRICS, type MetricKey } from '../metrics';
import type { SparkPoint } from './Sparkline.vue';

type Summary = ReturnType<typeof summary>;

export interface KpiDef {
    key: MetricKey;
    label: string;
    value: string;
    /** Fractional change vs the comparison period; undefined hides the delta. */
    delta?: number;
    /** Daily values across the selected range, for the tile sparkline. */
    series: SparkPoint[];
    /** Sparkline colour. */
    color: string;
    /** Formats a metric value for the sparkline tooltip. */
    formatValue: (value: number) => string;
}

export function buildKpis(current: Summary, daily: DailyPoint[], previous: Summary): KpiDef[] {
    return METRICS.map((metric) => {
        const before = metric.value(previous);
        return {
            key: metric.key,
            label: metric.label,
            color: metric.color,
            formatValue: metric.formatValue,
            value: metric.formatValue(metric.value(current)),
            delta: before === 0 ? undefined : metric.value(current) / before - 1,
            series: daily.map((d) => ({ date: d.date, value: metric.daily(d) })),
        };
    });
}

/** DOM id of a metric's tab, so the chart below can name the tab that drives it. */
export function kpiTabId(key: MetricKey) {
    return `wa-kpi-tab-${key}`;
}
</script>

<script setup lang="ts">
import { ref } from 'vue';

import { fmtDelta } from '../format';
import Sparkline from './Sparkline.vue';

/**
 * The KPI row doubles as the tab strip of the traffic card: each metric is a tab, and
 * the selected one drives the chart beneath it.
 */
const props = defineProps<{
    kpis: KpiDef[];
    /** The metric currently driving the traffic chart. */
    activeKey: MetricKey;
}>();
const emit = defineEmits<{ select: [key: MetricKey] }>();

const tabsRef = ref<HTMLDivElement>();

// Selection follows focus, so the roving tabIndex below always lands on the active tab.
const onKeyDown = (event: KeyboardEvent) => {
    const { kpis, activeKey } = props;
    const last = kpis.length - 1;
    const current = kpis.findIndex((kpi) => kpi.key === activeKey);
    let next: number;
    switch (event.key) {
        case 'ArrowRight':
            next = current === last ? 0 : current + 1;
            break;
        case 'ArrowLeft':
            next = current === 0 ? last : current - 1;
            break;
        case 'Home':
            next = 0;
            break;
        case 'End':
            next = last;
            break;
        default:
            return;
    }
    event.preventDefault();
    emit('select', kpis[next].key);
    tabsRef.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
};
</script>

<template>
    <div ref="tabsRef" class="wa-kpi-tabs" role="tablist" aria-label="Traffic metric" @keydown="onKeyDown">
        <button
            v-for="kpi in kpis"
            :id="kpiTabId(kpi.key)"
            :key="kpi.key"
            type="button"
            role="tab"
            :class="kpi.key === activeKey ? 'wa-kpi is-active' : 'wa-kpi'"
            :aria-selected="kpi.key === activeKey"
            :tabindex="kpi.key === activeKey ? 0 : -1"
            :style="kpi.key === activeKey ? { color: kpi.color } : undefined"
            @click="emit('select', kpi.key)"
        >
            <!-- Roving tab order: Tab reaches the strip, arrow keys move within it. The inline
                 style resolves `currentcolor` for the active tab's underline. -->
            <span class="wa-kpi-label">{{ kpi.label }}</span>
            <span class="wa-kpi-value">{{ kpi.value }}</span>
            <span
                v-if="kpi.delta != null"
                :class="`wa-kpi-delta ${(kpi.delta ?? 0) >= 0 ? 'wa-up' : 'wa-down'}`"
                v-text="`${fmtDelta(kpi.delta)} vs prev`"
            />
            <!-- The sparkline restates the tab's own figures, so keep its
                 chart DOM out of the button's accessible name. -->
            <span class="wa-kpi-spark-box" aria-hidden="true">
                <Sparkline :points="kpi.series" :color="kpi.color" :format-value="kpi.formatValue" />
            </span>
        </button>
    </div>
</template>
