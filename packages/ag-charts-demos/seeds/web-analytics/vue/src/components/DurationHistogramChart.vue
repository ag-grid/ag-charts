<script setup lang="ts">
import { computed } from 'vue';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-vue3';

import { PALETTE, THEME } from '../chartTheme';
import { fmtDuration, fmtInt } from '../format';
import type { Session } from '../types';

// Distribution of session durations. The histogram bins the raw per-session
// duration values and counts sessions per bin.
const props = defineProps<{ sessions: Session[] }>();

const options = computed<AgCartesianChartOptions>(() => ({
    theme: THEME,
    data: props.sessions,
    series: [
        {
            type: 'histogram',
            xKey: 'sessionDuration',
            xName: 'Session duration',
            yName: 'Sessions',
            binCount: 24,
            fill: PALETTE[0],
            stroke: 'white',
            strokeWidth: 1,
            cornerRadius: 4,
            tooltip: {
                renderer: () => ({
                    symbol: { marker: { enabled: false } },
                }),
            },
        },
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            label: { formatter: ({ value }) => fmtDuration(value) },
            gridLine: {
                enabled: false,
            },
            nice: false,
        },
        y: {
            type: 'number',
            position: 'left',
            nice: false,
        },
    },
    formatter: {
        y: ({ value }) => fmtInt(Number(value)),
    },
    legend: { enabled: false },
    padding: { top: 8, right: 0, bottom: 0, left: 0 },
}));
</script>

<template>
    <AgCharts :options="options" :style="{ height: '100%', width: '100%' }" />
</template>
