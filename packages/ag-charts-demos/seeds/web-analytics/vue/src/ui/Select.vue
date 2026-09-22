<script setup lang="ts">
// Thin wrapper around the reka-ui Select, styled via web-analytics.css. The parts map one to one
// onto Radix React's (Root, Trigger, Value, Icon, Portal, Content, Viewport, Item, ItemText), and
// render the same elements, roles and data-state attributes.
import {
    Label,
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

// `label` is optional in the React helper, which returns the bare trigger without one; the demo's
// one caller always labels its select, and a Vue template cannot reuse the trigger subtree in two
// branches, so the label is required here (see PORTING.md).
defineProps<{
    options: SelectOption[];
    ariaLabel: string;
    label: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
    <Label class="wa-labeled-select">
        <span>{{ label }}</span>
        <SelectRoot v-model="model">
            <SelectTrigger class="wa-btn wa-select-trigger" :aria-label="ariaLabel">
                <SelectValue />
                <SelectIcon>▾</SelectIcon>
            </SelectTrigger>
            <SelectPortal>
                <SelectContent class="wa-portal wa-select-content" position="popper" :side-offset="4">
                    <SelectViewport>
                        <SelectItem
                            v-for="option in options"
                            :key="option.value"
                            :value="option.value"
                            class="wa-select-item"
                        >
                            <SelectItemText>{{ option.label }}</SelectItemText>
                        </SelectItem>
                    </SelectViewport>
                </SelectContent>
            </SelectPortal>
        </SelectRoot>
    </Label>
</template>
