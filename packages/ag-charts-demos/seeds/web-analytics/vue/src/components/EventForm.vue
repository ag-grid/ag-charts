<script lang="ts">
import type { AnnotationType } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

/** `<input type="date">` speaks 'YYYY-MM-DD' in local time; Date#toISOString does not. */
const toInputValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const fromInputValue = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
};

/** Viewport coordinates of the right-click the form was opened from. */
export interface FormAnchor {
    x: number;
    y: number;
}

const TYPES: { value: AnnotationType; label: string }[] = [
    { value: 'marketing', label: 'Marketing' },
    { value: 'product', label: 'Product' },
];
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

/** Popover form for adding an event annotation, opened from the toolbar or the context menu. */
const props = defineProps<{
    /** Day the form opens on: the right-clicked point, or the end of the range. */
    date: Date;
    /** Days outside the chart's date domain would add an event the chart cannot show. */
    minDate: Date;
    maxDate: Date;
}>();
const emit = defineEmits<{
    submit: [date: Date, label: string, type: AnnotationType];
    cancel: [];
}>();

const dateValue = ref(toInputValue(props.date));
const label = ref('');
const type = ref<AnnotationType>('marketing');
const labelRef = ref<HTMLInputElement>();

const canSubmit = computed(() => label.value.trim() !== '' && dateValue.value !== '');

onMounted(() => labelRef.value?.focus());

const onSubmit = () => emit('submit', fromInputValue(dateValue.value), label.value.trim(), type.value);
</script>

<template>
    <form class="wa-event-form" @submit.prevent="onSubmit">
        <label class="wa-field">
            <span class="wa-field-label">Event name</span>
            <input
                ref="labelRef"
                v-model="label"
                class="wa-input"
                maxlength="40"
                placeholder="e.g. Pricing page test"
            />
        </label>
        <label class="wa-field">
            <span class="wa-field-label">Date</span>
            <input
                v-model="dateValue"
                class="wa-input"
                type="date"
                :min="toInputValue(minDate)"
                :max="toInputValue(maxDate)"
            />
        </label>
        <fieldset class="wa-fieldset">
            <legend class="wa-field-label">Type</legend>
            <div class="wa-radio-row">
                <label v-for="option in TYPES" :key="option.value" class="wa-radio"
                    ><input v-model="type" type="radio" name="wa-event-type" :value="option.value" />{{
                        option.label
                    }}</label
                >
            </div>
        </fieldset>
        <div class="wa-event-form-actions">
            <button type="button" class="wa-btn" @click="emit('cancel')">Cancel</button>
            <button type="submit" class="wa-btn wa-btn--primary" :disabled="!canSubmit">Add event</button>
        </div>
    </form>
</template>
