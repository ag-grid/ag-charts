<script setup lang="ts">
import { fmtInt } from '../format';
import type { KpiSegment } from '../types';

/** The bands in text, so the breakdown survives without colour or a hover. */
defineProps<{ segments: KpiSegment[] }>();
</script>

<template>
    <span class="pc-kpi-segment-keys">
        <span v-for="segment in segments" :key="segment.label" class="pc-kpi-segment-key"
            ><span aria-hidden="true" :style="{ color: segment.color }">{{ segment.icon }}</span>
            {{ fmtInt(segment.count) }} {{ segment.label.toLowerCase() }}</span
        >
    </span>
</template>
