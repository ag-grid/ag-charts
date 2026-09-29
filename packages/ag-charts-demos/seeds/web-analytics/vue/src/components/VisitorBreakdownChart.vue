<script setup lang="ts">
import { computed } from 'vue';

import type { AgPolarChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-vue3';

import { THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { VisitorDatum } from '../types';

const props = defineProps<{ data: VisitorDatum[] }>();

const options = computed<AgPolarChartOptions>(() => ({
    theme: THEME,
    data: props.data,
    series: [
        {
            type: 'donut',
            angleKey: 'sessions',
            legendItemKey: 'type',
            cornerRadius: 4,
            innerRadiusRatio: 0.8,
            tooltip: {
                renderer: () => ({
                    symbol: { marker: { shape: 'circle' } },
                }),
            },
        },
    ],
    legend: {
        enabled: true,
        position: 'right',
        spacing: 24,
        maxWidth: 240,
        item: {
            label: {
                formatter: ({ datum }) => `${datum.type} - ${fmtInt(datum.sessions)}`,
            },
            marker: {
                shape: 'circle',
                size: 12,
            },
        },
    },
    formatter: {
        angle: ({ value }) => fmtInt(Number(value)),
    },
    padding: { top: 8, right: 8, bottom: 8, left: 8 },
}));
</script>

<template>
    <AgCharts :options="options" :style="{ height: '100%', width: '100%' }" />
</template>
