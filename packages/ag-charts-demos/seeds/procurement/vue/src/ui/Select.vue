<script setup lang="ts">
// Thin wrapper around the reka-ui Select. With a `label` the control sits inside a reka-ui
// `Label` (Radix `Label.Root` in React), otherwise the bare control renders on its own, as the
// React `Select` helper does.
import { Label } from 'reka-ui';

import SelectControl from './SelectControl.vue';
import { type SelectOption } from './types';

defineProps<{
    options: SelectOption[];
    ariaLabel: string;
    label?: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
    <Label v-if="label" class="pc-labeled-select">
        <span>{{ label }}</span>
        <SelectControl v-model="model" :options="options" :aria-label="ariaLabel" />
    </Label>
    <SelectControl v-else v-model="model" :options="options" :aria-label="ariaLabel" />
</template>
