<script setup lang="ts">
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui';
import { computed, ref, shallowRef, watch } from 'vue';

import type { DailyPoint } from '../data';
import { fmtInt } from '../format';
import type { MetricKey } from '../metrics';
import type { Annotation, AnnotationType, Session } from '../types';
import EmptyState from './EmptyState.vue';
import EventForm, { type FormAnchor } from './EventForm.vue';
import KpiTiles, { type KpiDef, kpiTabId } from './KpiTiles.vue';
import SessionsGrid from './SessionsGrid.vue';
import TrafficChart from './TrafficChart.vue';
import { dayKey, sameDaySet } from './dateFilter';

const props = defineProps<{
    daily: DailyPoint[];
    dailyPrevious: DailyPoint[];
    /** Every session in the selected range — feeds the sessions grid. */
    sessions: Session[];
    annotations: Annotation[];
    kpis: KpiDef[];
    /** The metric currently driving the traffic chart. */
    metric: MetricKey;
    hasData: boolean;
}>();
const emit = defineEmits<{
    metricSelect: [key: MetricKey];
    annotationAdd: [date: Date, label: string, type: AnnotationType];
    annotationRemove: [annotationId: string];
}>();

// Days selected on the traffic chart narrow the sessions grid; empty = whole range.
const selectedDays = shallowRef<Date[]>([]);
// Reported back by the grid; feeds the card's count and never reaches the chart.
const filterModel = shallowRef<Record<string, unknown>>({});
const displayedRowCount = ref(0);
const onGridStateChange = (model: Record<string, unknown>, rowCount: number) => {
    filterModel.value = model;
    displayedRowCount.value = rowCount;
};
const gridRef = ref<InstanceType<typeof SessionsGrid>>();
// Clicked annotation, and the day the add-event form is open on (null = closed).
const selectedAnnotationId = ref<string | null>(null);
const formDay = shallowRef<Date | null>(null);
// Where the form opens: the right-clicked point, or under the toolbar button.
const formAnchor = shallowRef<FormAnchor | undefined>();

const selectedAnnotation = computed(() => props.annotations.find((a) => a.annotationId === selectedAnnotationId.value));

// Dropping out of the date range deselects for good, so widening it again does not resurrect it.
watch(
    [selectedAnnotationId, selectedAnnotation],
    ([annotationId, annotation]) => {
        if (annotationId != null && !annotation) selectedAnnotationId.value = null;
    },
    { flush: 'post' }
);
// The charted day domain, which also bounds the form's date field.
const firstDay = computed(() => props.daily[0]?.date);
const lastDay = computed(() => props.daily.at(-1)?.date);

// Clicking the selected annotation again deselects it.
const selectAnnotation = (annotationId: string | null) => {
    const prev = selectedAnnotationId.value;
    selectedAnnotationId.value = annotationId != null && annotationId === prev ? null : annotationId;
};

const removeAnnotation = (annotationId: string) => {
    if (selectedAnnotationId.value === annotationId) selectedAnnotationId.value = null;
    emit('annotationRemove', annotationId);
};

const openEventForm = (day: Date, anchor?: FormAnchor) => {
    formDay.value = day;
    formAnchor.value = anchor;
};

// A right-click opens the form at the pointer; the toolbar button anchors it itself.
const pointAnchor = computed(() => {
    const anchor = formAnchor.value;
    return anchor && { getBoundingClientRect: () => new DOMRect(anchor.x, anchor.y, 0, 0) };
});

// The popover reports its open state; opening from the trigger lands on the last charted day.
const onOpenChange = (open: boolean) => {
    if (open && lastDay.value) openEventForm(lastDay.value);
    else formDay.value = null;
};

const addEvent = (date: Date, label: string, type: AnnotationType) => {
    formDay.value = null;
    emit('annotationAdd', date, label, type);
};

const activeFilterCount = computed(() => Object.keys(filterModel.value).length);

// Only the column filters; the chart selection is cleared by clicking empty chart space.
const clearFilters = () => gridRef.value?.clearFilters();

// Ignore no-op updates so re-selecting the same days does not churn the grid's row data.
const setDays = (days: Date[]) => {
    if (!sameDaySet(selectedDays.value, days)) selectedDays.value = days;
};

// The grid's row data, which its column filters then narrow.
const daySessions = computed(() => {
    if (selectedDays.value.length === 0) return [];
    const keys = new Set(selectedDays.value.map(dayKey));
    return props.sessions.filter((s) => keys.has(dayKey(new Date(s.timestamp))));
});

const gridSummary = computed(() => {
    const count = selectedDays.value.length;
    if (count === 0) {
        return `No days selected.`;
    }
    const days = `${count} selected ${count === 1 ? 'day' : 'days'}`;
    const filters = activeFilterCount.value;
    if (filters === 0) return `${fmtInt(daySessions.value.length)} sessions on ${days}`;
    return (
        `${fmtInt(displayedRowCount.value)} out of ${fmtInt(daySessions.value.length)} sessions on ${days} ` +
        `(${filters} ${filters === 1 ? 'filter' : 'filters'} applied)`
    );
});
</script>

<template>
    <div class="wa-view">
        <section class="wa-card wa-card--tabbed">
            <KpiTiles :kpis="kpis" :active-key="metric" @select="emit('metricSelect', $event)" />
            <div class="wa-card-head">
                <div>
                    <h2 class="wa-card-title">Traffic over time</h2>
                </div>
                <div class="wa-card-actions">
                    <button
                        v-if="selectedAnnotation"
                        class="wa-btn"
                        v-text="`Remove “${selectedAnnotation.label}”`"
                        @click="removeAnnotation(selectedAnnotation.annotationId)"
                    />
                    <PopoverRoot :open="formDay != null" @update:open="onOpenChange">
                        <!-- Renders no element of its own (as-child with no child), like Radix's
                             virtual-ref Anchor; it only moves the popover's reference point. -->
                        <PopoverAnchor v-if="pointAnchor" as-child :reference="pointAnchor" />
                        <PopoverTrigger class="wa-btn wa-btn--secondary" :disabled="!lastDay">Add event</PopoverTrigger>
                        <PopoverPortal>
                            <PopoverContent
                                class="wa-portal"
                                side="bottom"
                                align="end"
                                :side-offset="6"
                                :collision-padding="8"
                            >
                                <EventForm
                                    v-if="formDay != null && firstDay && lastDay"
                                    :key="formDay.getTime()"
                                    :date="formDay"
                                    :min-date="firstDay"
                                    :max-date="lastDay"
                                    @submit="addEvent"
                                    @cancel="formDay = null"
                                />
                                <!-- Reopening on another day starts the form afresh (the key). -->
                            </PopoverContent>
                        </PopoverPortal>
                    </PopoverRoot>
                </div>
            </div>
            <div class="wa-chart-box-lg" role="tabpanel" :aria-labelledby="kpiTabId(metric)">
                <TrafficChart
                    v-if="hasData"
                    :metric="metric"
                    :daily="daily"
                    :daily-previous="dailyPrevious"
                    :annotations="annotations"
                    :selected-days="selectedDays"
                    :selected-annotation-id="selectedAnnotation?.annotationId ?? null"
                    @selection-change="setDays"
                    @annotation-select="selectAnnotation"
                    @annotation-remove="removeAnnotation"
                    @add-event-at="openEventForm"
                />
                <EmptyState v-else message="No sessions in this date range" hint="Try widening the range." />
            </div>
        </section>

        <section class="wa-card">
            <div class="wa-card-head">
                <div>
                    <h2 class="wa-card-title">Sessions</h2>
                    <span class="wa-card-sub">{{ gridSummary }}</span>
                </div>
                <button class="wa-btn" :disabled="activeFilterCount === 0" @click="clearFilters">Clear filters</button>
            </div>
            <SessionsGrid v-if="hasData" ref="gridRef" :sessions="daySessions" @grid-state-change="onGridStateChange" />
            <EmptyState v-else message="No sessions in this date range" hint="Try widening the range." />
        </section>
    </div>
</template>
