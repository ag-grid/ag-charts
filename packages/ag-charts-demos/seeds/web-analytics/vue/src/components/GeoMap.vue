<script setup lang="ts">
import { computed } from 'vue';

import type { AgChartOptions, AgMapShapeSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-vue3';

import { SEQUENTIAL_BLUE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import { topology } from '../topology';
import type { CountryDatum } from '../types';

const props = defineProps<{ data: CountryDatum[] }>();

// The "Unknown" bucket has no matching geography, so it can't be placed.
const mapData = computed(() => props.data.filter((row) => row.country !== 'Unknown'));

const options = computed<AgChartOptions>(() => {
    const shape: AgMapShapeSeriesOptions = {
        type: 'map-shape',
        idKey: 'country',
        colorKey: 'sessions',
        colorName: 'Sessions',
        topologyIdKey: 'name',
        colorScale: {
            fills: SEQUENTIAL_BLUE.map((color) => ({ color })),
        },
    };
    return {
        theme: THEME,
        topology,
        data: mapData.value,
        series: [{ type: 'map-shape-background' }, shape],
        gradientLegend: { enabled: true },
        padding: 0,
        // Formats the session count wherever it appears — tooltip and legend scale.
        formatter: {
            color: ({ value }) => fmtInt(Number(value)),
        },
    };
});
</script>

<template>
    <AgCharts :options="options" :style="{ height: '100%', width: '100%' }" />
</template>
