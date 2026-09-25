<script setup lang="ts">
// Per-widget empty state, so one data-less chart doesn't render a broken axis.
defineProps<{
    message: string;
    hint?: string;
}>();
</script>

<template>
    <div class="wa-empty">
        <span class="wa-empty-icon" aria-hidden="true">◔</span>
        <span>{{ message }}</span>
        <span v-if="hint" class="wa-card-sub">{{ hint }}</span>
    </div>
</template>
