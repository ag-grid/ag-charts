<script lang="ts">
import type { AgSparklineOptions } from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { fmtDate } from '../format';

/** One sparkline point: a daily value tagged with its date. */
export interface SparkPoint {
    date: Date;
    value: number;
}

interface Datum {
    x: number;
    y: number;
    date: Date;
}

function sparklineOptions(
    container: HTMLElement,
    points: SparkPoint[],
    color: string,
    formatValue: (value: number) => string
): AgSparklineOptions {
    const data: Datum[] = points.map((point, x) => ({ x, y: point.value, date: point.date }));
    return {
        type: 'area',
        theme: THEME,
        container,
        data,
        xKey: 'x',
        yKey: 'y',
        minWidth: 0,
        minHeight: 0,
        background: { visible: false },
        padding: { top: 3, right: 4, bottom: 3, left: 4 },
        fill: {
            type: 'gradient',
            colorStops: [{ color: '#ffffff' }, { color: color }],
        },
        fillOpacity: 0.3,
        stroke: color,
        strokeWidth: 2,
        marker: { fill: color },
        tooltip: {
            position: {
                placement: ['top'],
            },
            renderer: ({ datum }: { datum: Datum }) => ({
                title: fmtDate(datum.date),
                content: formatValue(datum.y),
            }),
        },
    };
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { type AgChartInstance, AgCharts } from 'ag-charts-community';

const props = defineProps<{
    points: SparkPoint[];
    color: string;
    /** Formats a value for the tooltip, matching the tile's headline formatting. */
    formatValue: (value: number) => string;
}>();

const containerRef = ref<HTMLDivElement>();
let chart: AgChartInstance<AgSparklineOptions> | undefined;

// The sparkline API has no Vue wrapper, so the instance is updated in place:
// recreating it per render would restart the entry animation on every change.
onMounted(() => {
    chart = AgCharts.__createSparkline(
        sparklineOptions(containerRef.value!, props.points, props.color, props.formatValue)
    );
});
watch([() => props.points, () => props.color, () => props.formatValue], ([points, color, formatValue]) => {
    void chart?.update(sparklineOptions(containerRef.value!, points, color, formatValue));
});

onBeforeUnmount(() => {
    chart?.destroy();
    chart = undefined;
});
</script>

<template>
    <div ref="containerRef" class="wa-kpi-spark" />
</template>
