<script setup lang="ts">
import { computed } from 'vue';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-vue3';

import { PALETTE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { ChannelDatum } from '../types';

const props = defineProps<{ data: ChannelDatum[] }>();

const options = computed<AgCartesianChartOptions>(() => ({
    theme: THEME,
    data: props.data,
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'channel',
            yKey: 'sessions',
            yName: 'Sessions',
            fillOpacity: 0.2,
            width: 12,
            label: {
                enabled: true,
                placement: 'outside-end',
                spacing: 12,
                fontWeight: 'bold',
            },
            highlight: {
                enabled: false,
            },
        },
        {
            type: 'scatter',
            xKey: 'sessions',
            yKey: 'channel',
            size: 12,
            fillOpacity: 1,
            fill: PALETTE[0],
            stroke: PALETTE[0],
            highlight: {
                enabled: false,
            },
        },
    ],
    // Horizontal bars: the category axis sits on the left, the value axis on the bottom.
    axes: {
        y: { type: 'category', position: 'left' },
        x: {
            type: 'number',
            position: 'bottom',
            nice: false,
            gridLine: { width: 0 },
            label: { enabled: false },
        },
    },
    legend: { enabled: false },
    padding: { top: 8, right: 48, bottom: 8, left: 8 },
    // Formats the session count on the bar labels.
    formatter: {
        y: ({ value }) => fmtInt(Number(value)),
    },
    tooltip: {
        enabled: false,
    },
}));
</script>

<template>
    <AgCharts :options="options" :style="{ height: '100%', width: '100%' }" />
</template>
