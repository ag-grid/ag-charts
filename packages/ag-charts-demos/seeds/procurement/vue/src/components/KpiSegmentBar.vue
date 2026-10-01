<script lang="ts">
import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';

import { SEGMENT_SEPARATOR, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { KpiSegment } from '../types';

/** One row of stacked bands, so the segments share a single 100%-wide bar. */
interface SegmentRow {
    row: string;
    [label: string]: string | number;
}

/**
 * The figure's composition, as one bar.
 *
 * The at-risk count says how many need watching but not how that sits against the rest of her
 * freight — three at risk out of five is a different morning from three out of thirty, and the
 * width of the healthy band is that reading.
 */
function segmentOptions(segments: KpiSegment[]): AgCartesianChartOptions<SegmentRow> {
    const datum: SegmentRow = { row: 'shipments' };
    for (const segment of segments) datum[segment.label] = segment.count;

    const series = segments.map<AgBarSeriesOptions<SegmentRow>>((segment) => ({
        type: 'bar',
        direction: 'horizontal',
        xKey: 'row',
        yKey: segment.label,
        yName: segment.label,
        stacked: true,
        normalizedTo: 100,
        fill: segment.color,
        ...SEGMENT_SEPARATOR,
        tooltip: {
            renderer: () => ({
                title: segment.label,
                content: `${fmtInt(segment.count)} ${segment.count === 1 ? 'shipment' : 'shipments'}`,
            }),
        },
    }));

    return {
        theme: THEME,
        data: [datum],
        series,
        // A single bar filling the box: every axis, tick and label would only repeat the tile.
        axes: {
            y: { type: 'category', label: { enabled: false }, line: { enabled: false }, tick: { enabled: false } },
            x: {
                type: 'number',
                label: { enabled: false },
                line: { enabled: false },
                tick: { enabled: false },
                gridLine: { enabled: false },
            },
        },
        legend: { enabled: false },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };
}
</script>

<script setup lang="ts">
import { computed } from 'vue';

import { AgCharts } from 'ag-charts-vue3';

const props = defineProps<{ segments: KpiSegment[] }>();

const options = computed(() => segmentOptions(props.segments));
</script>

<template>
    <span class="pc-kpi-segments">
        <AgCharts :options="options" :style="{ height: '100%', width: '100%' }" />
    </span>
</template>
