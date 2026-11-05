<script setup lang="ts">
// Thin wrapper around the reka-ui ToggleGroup. With a `label` the group sits beside a visually
// paired caption (hidden from assistive technology, which reads the group's own `aria-label`),
// otherwise the bare group renders on its own, as the React `ToggleGroup` helper does.
import ToggleGroupControl from './ToggleGroupControl.vue';
import { type ToggleOption } from './types';

defineProps<{
    options: ToggleOption[];
    ariaLabel: string;
    label?: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
    <div v-if="label" class="pc-labeled-select">
        <span aria-hidden="true">{{ label }}</span>
        <ToggleGroupControl v-model="model" :options="options" :aria-label="ariaLabel" />
    </div>
    <ToggleGroupControl v-else v-model="model" :options="options" :aria-label="ariaLabel" />
</template>
