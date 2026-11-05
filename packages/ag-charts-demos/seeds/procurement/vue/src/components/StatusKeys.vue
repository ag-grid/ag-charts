<script lang="ts">
import { STATUS_COLORS, STATUS_ICONS } from '../chartTheme';
import { fmtInt } from '../format';
import type { KpiSegment, ShipmentStatus } from '../types';

/** Worst first, so the statuses she is measured on lead every bar and key. */
export const STATUS_ORDER: ShipmentStatus[] = ['Late', 'At risk', 'On time'];

/** One segment per status, in `STATUS_ORDER`, carrying the status inks and glyphs. */
export function statusSegments(counts?: Record<ShipmentStatus, number>): KpiSegment[] {
    return STATUS_ORDER.map((status) => ({
        label: status,
        count: counts?.[status] ?? 0,
        color: STATUS_COLORS[status],
        icon: STATUS_ICONS[status],
    }));
}
</script>

<script setup lang="ts">
/**
 * The status breakdown in text, shared by the at-risk tile and the in-transit map, so the
 * breakdown survives without colour or a hover and reads the same wherever it appears.
 */
withDefaults(defineProps<{ segments: KpiSegment[]; showCounts?: boolean }>(), { showCounts: true });
</script>

<template>
    <span class="pc-status-keys">
        <span v-for="segment in segments" :key="segment.label" class="pc-status-key"
            ><span aria-hidden="true" :style="{ color: segment.color }">{{ segment.icon }}</span>
            {{ showCounts ? `${fmtInt(segment.count)} ${segment.label.toLowerCase()}` : segment.label }}</span
        >
    </span>
</template>
