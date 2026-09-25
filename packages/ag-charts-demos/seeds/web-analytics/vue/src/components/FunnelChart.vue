<script setup lang="ts">
import { computed } from 'vue';

import type { AgChartOptions, AgFunnelSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-vue3';

import { FUNNEL_COLORS, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { FunnelStep } from '../types';

const props = defineProps<{ data: FunnelStep[] }>();

const options = computed<AgChartOptions>(() => {
    const series: AgFunnelSeriesOptions = {
        type: 'funnel',
        stageKey: 'stepName',
        valueKey: 'sessionsEntering',
        fills: FUNNEL_COLORS,
        strokeWidth: 0,
        cornerRadius: 5,
        stageLabel: {
            enabled: false,
        },
        label: {
            placement: ['inside-center', 'outside-after'],
            formatter: ({ datum }) => [
                { text: datum.stepName, fontSize: 13, fontWeight: 'bold' },
                { text: '\n' },
                { text: fmtInt(datum.sessionsEntering), fontSize: 12, color: 'white' },
            ],
        },
    };
    return {
        theme: THEME,
        data: props.data,
        series: [series],
        padding: 0,
        formatter: {
            y: ({ value }) => fmtInt(Number(value)),
        },
    };
});
</script>

<template>
    <AgCharts :options="options" :style="{ height: '100%', width: '100%' }" />
</template>
