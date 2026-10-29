<script setup lang="ts">
// The reka-ui ToggleGroup itself. Radix React renders a single-select group as a radio group
// (`role="radiogroup"`, items `role="radio"` with `aria-checked`); reka-ui renders a plain group of
// pressed buttons, so the roles are set here for the same accessibility tree. Roving focus,
// `data-state` and the class names come from reka-ui as they do from Radix. `ToggleGroup.vue` adds
// the optional label wrapper.
import { type AcceptableValue, ToggleGroupItem, ToggleGroupRoot } from 'reka-ui';

import { type ToggleOption } from './types';

defineProps<{
    options: ToggleOption[];
    ariaLabel: string;
}>();

const model = defineModel<string>({ required: true });

// Pressing the selected item again reports an empty selection; like Radix's `onValueChange`
// handler in the React demo, that is ignored so one option is always active.
function onUpdate(next: AcceptableValue | AcceptableValue[]) {
    if (typeof next === 'string' && next) model.value = next;
}
</script>

<template>
    <ToggleGroupRoot as-child type="single" :model-value="model" @update:model-value="onUpdate">
        <div class="pc-toggle-group" role="radiogroup" :aria-label="ariaLabel">
            <template v-for="option in options" :key="option.value">
                <ToggleGroupItem
                    v-if="option.icon == null"
                    class="pc-toggle-item"
                    :value="option.value"
                    role="radio"
                    :aria-checked="option.value === model"
                    :aria-pressed="undefined"
                    >{{ option.label }}</ToggleGroupItem
                >
                <ToggleGroupItem
                    v-else
                    class="pc-toggle-item pc-toggle-item--icon"
                    :value="option.value"
                    role="radio"
                    :aria-checked="option.value === model"
                    :aria-pressed="undefined"
                    :aria-label="option.label"
                    :title="option.label"
                    ><component :is="option.icon"
                /></ToggleGroupItem>
            </template>
        </div>
    </ToggleGroupRoot>
</template>
