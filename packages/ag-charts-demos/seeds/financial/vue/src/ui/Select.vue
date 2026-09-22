<script setup lang="ts">
// Thin wrapper around the reka-ui Select, styled for the terminal via financial.css. The parts map
// one to one onto Radix React's (Root, Trigger, Value, Icon, Portal, Content, Viewport, Item,
// ItemText), and render the same elements, roles and data-state attributes.
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

defineProps<{
    options: SelectOption[];
    ariaLabel: string;
    label: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
    <Label :for="label" class="fin-labeled-select">
        <span>{{ label }}</span>
        <SelectRoot v-model="model">
            <SelectTrigger class="fin-btn fin-select-trigger" :aria-label="ariaLabel">
                <SelectValue />
                <SelectIcon>▾</SelectIcon>
            </SelectTrigger>
            <SelectPortal>
                <SelectContent class="fin-portal fin-select-content" position="popper" :side-offset="4">
                    <SelectViewport>
                        <SelectItem
                            v-for="option in options"
                            :key="option.value"
                            :value="option.value"
                            class="fin-select-item"
                        >
                            <SelectItemText>{{ option.label }}</SelectItemText>
                        </SelectItem>
                    </SelectViewport>
                </SelectContent>
            </SelectPortal>
        </SelectRoot>
    </Label>
</template>
