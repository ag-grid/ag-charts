import type { Component } from 'vue';

export interface SelectOption {
    value: string;
    label: string;
}

export interface ToggleOption extends SelectOption {
    /** Shown in place of the text; the label is kept as the item's accessible name and tooltip. */
    icon?: Component;
}
