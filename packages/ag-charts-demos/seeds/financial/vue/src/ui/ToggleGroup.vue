<script setup lang="ts">
// Thin wrapper around the reka-ui ToggleGroup. Radix React renders a single-select group as a
// radio group (`role="radiogroup"`, items `role="radio"` with `aria-checked`); reka-ui renders a
// plain group of pressed buttons, so the roles are set here for the same accessibility tree. Roving
// focus, `data-state` and the class names come from reka-ui as they do from Radix.
import { type AcceptableValue, ToggleGroupItem, ToggleGroupRoot } from 'reka-ui';

import { type SelectOption } from './types';

defineProps<{
    options: SelectOption[];
    'aria-label': string;
}>();

const model = defineModel<string>({ required: true });

// Pressing the selected item again reports an empty selection; like Radix's `onValueChange`
// handler in the React demo, that is ignored so one range is always active.
function onUpdate(next: AcceptableValue | AcceptableValue[]) {
    if (typeof next === 'string' && next) model.value = next;
}
</script>

<template>
    <ToggleGroupRoot as-child type="single" :model-value="model" @update:model-value="onUpdate">
        <div class="fin-toggle-group" role="radiogroup" :aria-label="$props['aria-label']">
            <ToggleGroupItem
                v-for="option in options"
                :key="option.value"
                class="fin-toggle-item"
                :value="option.value"
                role="radio"
                :aria-checked="option.value === model"
                :aria-pressed="undefined"
                >{{ option.label }}</ToggleGroupItem
            >
        </div>
    </ToggleGroupRoot>
</template>
