<script setup lang="ts">
// The reka-ui Select itself, styled via procurement.css. The parts map one to one onto Radix
// React's (Root, Trigger, Value, Icon, Portal, Content, Viewport, Item, ItemText), and render the
// same elements, roles and data-state attributes. `Select.vue` adds the optional label wrapper.
import {
    SelectContent,
    SelectIcon,
    SelectItem,
    SelectItemText,
    SelectPortal,
    SelectRoot,
    SelectTrigger,
    SelectValue,
    SelectViewport,
} from 'reka-ui';

import { type SelectOption } from './types';

defineProps<{
    options: SelectOption[];
    ariaLabel: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
    <SelectRoot v-model="model">
        <SelectTrigger class="pc-btn pc-select-trigger" :aria-label="ariaLabel">
            <SelectValue />
            <SelectIcon>▾</SelectIcon>
        </SelectTrigger>
        <SelectPortal>
            <SelectContent class="pc-portal pc-select-content" position="popper" :side-offset="4">
                <SelectViewport>
                    <SelectItem
                        v-for="option in options"
                        :key="option.value"
                        :value="option.value"
                        class="pc-select-item"
                    >
                        <SelectItemText>{{ option.label }}</SelectItemText>
                    </SelectItem>
                </SelectViewport>
            </SelectContent>
        </SelectPortal>
    </SelectRoot>
</template>
