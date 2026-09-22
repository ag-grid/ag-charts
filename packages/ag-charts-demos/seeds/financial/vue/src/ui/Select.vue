<script setup lang="ts">
// Thin wrapper around the reka-ui Select, styled for the terminal via financial.css. The parts map
// one to one onto Radix React's (Root, Trigger, Value, Icon, Portal, Content, Viewport, Item,
// ItemText), and render the same elements, roles and data-state attributes. Two Radix behaviours
// reka-ui does not share are added here (see PORTING.md): a character typed on the closed trigger
// moves the value to the option it matches, and an option is `aria-selected` only while it is both
// the value and focused.
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
import { ref, watch } from 'vue';

import { createTypeahead, findNextItem } from './typeahead';
import { type SelectOption } from './types';

const props = defineProps<{
    options: SelectOption[];
    ariaLabel: string;
    label: string;
}>();

const model = defineModel<string>({ required: true });

const open = ref(false);
/** The value of the option that has focus in the open listbox. */
const focused = ref<string>();

const triggerTypeahead = createTypeahead();
// Opening drops the trigger's search, as Radix does.
watch(open, (isOpen) => {
    if (isOpen) triggerTypeahead.reset();
});

/** A character typed on the closed trigger moves the value to the option it matches. */
function onTriggerKeydown(event: KeyboardEvent) {
    if (open.value || event.ctrlKey || event.altKey || event.metaKey || event.key.length !== 1) return;
    // Space extends a search in progress rather than opening; reka-ui skips it for the same reason.
    if (event.key === ' ' && triggerTypeahead.active) return;
    const current = props.options.find((option) => option.value === model.value);
    const search = triggerTypeahead.add(event.key);
    const next = findNextItem(props.options, (option) => option.label, search, current);
    if (next !== undefined) model.value = next.value;
}
</script>

<template>
    <Label :for="label" class="fin-labeled-select">
        <span>{{ label }}</span>
        <SelectRoot v-model="model" v-model:open="open">
            <SelectTrigger class="fin-btn fin-select-trigger" :aria-label="ariaLabel" @keydown="onTriggerKeydown">
                <SelectValue />
                <SelectIcon>▾</SelectIcon>
            </SelectTrigger>
            <SelectPortal>
                <SelectContent class="fin-portal fin-select-content" position="popper" :side-offset="4">
                    <SelectViewport>
                        <!-- The option element is supplied so its aria-selected wins over reka-ui's. -->
                        <SelectItem v-for="option in options" :key="option.value" :value="option.value" as-child>
                            <div
                                class="fin-select-item"
                                :aria-selected="option.value === model && option.value === focused"
                                @focus="focused = option.value"
                                @blur="focused = undefined"
                            >
                                <SelectItemText>{{ option.label }}</SelectItemText>
                            </div>
                        </SelectItem>
                    </SelectViewport>
                </SelectContent>
            </SelectPortal>
        </SelectRoot>
    </Label>
</template>
