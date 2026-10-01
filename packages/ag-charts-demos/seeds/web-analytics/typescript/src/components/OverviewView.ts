import type { DailyPoint } from '../data';
import { type View, createSlot, h } from '../dom';
import { fmtInt } from '../format';
import type { MetricKey } from '../metrics';
import type { Annotation, AnnotationType, Session } from '../types';
import { createPopover } from '../ui';
import { createEmptyState } from './EmptyState';
import { type FormAnchor, createEventForm } from './EventForm';
import { type KpiDef, createKpiTiles, kpiTabId } from './KpiTiles';
import { type SessionsGrid, createSessionsGrid } from './SessionsGrid';
import { type TrafficChart, createTrafficChart } from './TrafficChart';
import { dayKey, sameDaySet } from './dateFilter';

export interface OverviewViewProps {
    daily: DailyPoint[];
    dailyPrevious: DailyPoint[];
    /** Every session in the selected range — feeds the sessions grid. */
    sessions: Session[];
    annotations: Annotation[];
    kpis: KpiDef[];
    /** The metric currently driving the traffic chart. */
    metric: MetricKey;
    hasData: boolean;
    onMetricSelect: (key: MetricKey) => void;
    onAnnotationAdd: (date: Date, label: string, type: AnnotationType) => void;
    onAnnotationRemove: (annotationId: string) => void;
}

export interface OverviewView extends View {
    update(props: OverviewViewProps): void;
}

export function createOverviewView(initial: OverviewViewProps): OverviewView {
    let props = initial;

    // Days selected on the traffic chart narrow the sessions grid; empty = whole range.
    let selectedDays: Date[] = [];
    // Reported back by the grid; feeds the card's count and never reaches the chart.
    let filterModel: Record<string, unknown> = {};
    let displayedRowCount = 0;
    // Clicked annotation, and the day the add-event form is open on (null = closed).
    let selectedAnnotationId: string | null = null;
    let formDay: Date | null = null;
    // Where the form opens: the right-clicked point, or under the toolbar button.
    let formAnchor: FormAnchor | undefined;

    // Every state change re-renders, as a React state setter does; changes that arrive while a
    // render is in progress (a chart or grid callback fired by an update) are folded into it.
    let rendering = false;
    let dirty = false;
    function render() {
        if (rendering) {
            dirty = true;
            return;
        }
        rendering = true;
        try {
            do {
                dirty = false;
                renderOnce();
            } while (dirty);
        } finally {
            rendering = false;
        }
    }

    const onGridStateChange = (model: Record<string, unknown>, rowCount: number) => {
        filterModel = model;
        displayedRowCount = rowCount;
        render();
    };

    // Clicking the selected annotation again deselects it.
    const selectAnnotation = (annotationId: string | null) => {
        selectedAnnotationId = annotationId != null && annotationId === selectedAnnotationId ? null : annotationId;
        render();
    };

    const removeAnnotation = (annotationId: string) => {
        if (selectedAnnotationId === annotationId) selectedAnnotationId = null;
        props.onAnnotationRemove(annotationId);
        render();
    };

    const openEventForm = (day: Date, anchor?: FormAnchor) => {
        formDay = day;
        formAnchor = anchor;
        render();
    };

    const closeEventForm = () => {
        formDay = null;
        render();
    };

    const addEvent = (date: Date, label: string, type: AnnotationType) => {
        formDay = null;
        props.onAnnotationAdd(date, label, type);
        render();
    };

    // Only the column filters; the chart selection is cleared by clicking empty chart space.
    const clearFilters = () => grid?.clearFilters();

    // Ignore no-op updates so re-selecting the same days does not churn the grid's row data.
    const setDays = (days: Date[]) => {
        if (sameDaySet(selectedDays, days)) return;
        selectedDays = days;
        render();
    };

    // The grid's row data, which its column filters then narrow. Memoised on its inputs so the
    // grid sees a new array only when the rows can have changed.
    let daySessionsInputs: [Session[], Date[]] | undefined;
    let daySessions: Session[] = [];
    function computeDaySessions() {
        if (daySessionsInputs?.[0] === props.sessions && daySessionsInputs[1] === selectedDays) return daySessions;
        daySessionsInputs = [props.sessions, selectedDays];
        if (selectedDays.length === 0) {
            daySessions = [];
        } else {
            const keys = new Set(selectedDays.map(dayKey));
            daySessions = props.sessions.filter((s) => keys.has(dayKey(new Date(s.timestamp))));
        }
        return daySessions;
    }

    function gridSummary(activeFilterCount: number) {
        if (selectedDays.length === 0) {
            return `No days selected.`;
        }
        const days = `${selectedDays.length} selected ${selectedDays.length === 1 ? 'day' : 'days'}`;
        if (activeFilterCount === 0) return `${fmtInt(daySessions.length)} sessions on ${days}`;
        return (
            `${fmtInt(displayedRowCount)} out of ${fmtInt(daySessions.length)} sessions on ${days} ` +
            `(${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} applied)`
        );
    }

    const kpiTiles = createKpiTiles({ kpis: props.kpis, activeKey: props.metric, onSelect: props.onMetricSelect });

    const removeButtonHost = h('div', { class: 'wa-card-actions' });
    let removeButton: HTMLButtonElement | undefined;

    const popover = createPopover({
        onOpenChange: (open) => {
            const lastDay = props.daily.at(-1)?.date;
            if (open && lastDay) openEventForm(lastDay);
            else closeEventForm();
        },
        triggerClass: 'wa-btn wa-btn--secondary',
        triggerLabel: 'Add event',
    });
    removeButtonHost.append(popover.trigger);
    // Reopening on another day starts the form afresh (the React `key`).
    let formView: { key: number; view: View } | undefined;

    const selectedAnnotation = () => props.annotations.find((a) => a.annotationId === selectedAnnotationId);

    const trafficProps = () => ({
        metric: props.metric,
        daily: props.daily,
        dailyPrevious: props.dailyPrevious,
        annotations: props.annotations,
        selectedDays,
        onSelectionChange: setDays,
        selectedAnnotationId: selectedAnnotation()?.annotationId ?? null,
        onAnnotationSelect: selectAnnotation,
        onAnnotationRemove: removeAnnotation,
        onAddEventAt: openEventForm,
    });
    const chartSlot = createSlot(() =>
        props.hasData
            ? { key: 'chart' as const, make: () => createTrafficChart(trafficProps()) }
            : {
                  key: 'empty' as const,
                  make: () => createEmptyState('No sessions in this date range', 'Try widening the range.'),
              }
    );
    const chartBox = h('div', { class: 'wa-chart-box-lg', role: 'tabpanel' }, chartSlot.el);

    let grid: SessionsGrid | undefined;
    const gridSlot = createSlot(() =>
        props.hasData
            ? {
                  key: 'grid' as const,
                  make: () => (grid = createSessionsGrid({ sessions: computeDaySessions(), onGridStateChange })),
              }
            : {
                  key: 'empty' as const,
                  make: () => {
                      grid = undefined;
                      return createEmptyState('No sessions in this date range', 'Try widening the range.');
                  },
              }
    );

    const summary = h('span', { class: 'wa-card-sub' });
    const clearButton = h('button', { class: 'wa-btn', onclick: clearFilters }, 'Clear filters');

    const el = h(
        'div',
        { class: 'wa-view' },
        h(
            'section',
            { class: 'wa-card wa-card--tabbed' },
            kpiTiles.el,
            h(
                'div',
                { class: 'wa-card-head' },
                h('div', {}, h('h2', { class: 'wa-card-title' }, 'Traffic over time')),
                removeButtonHost
            ),
            chartBox
        ),
        h(
            'section',
            { class: 'wa-card' },
            h(
                'div',
                { class: 'wa-card-head' },
                h('div', {}, h('h2', { class: 'wa-card-title' }, 'Sessions'), summary),
                clearButton
            ),
            gridSlot.el
        )
    );

    function renderOnce() {
        // Dropping out of the date range deselects for good, so widening it again does not resurrect it.
        if (selectedAnnotationId != null && !selectedAnnotation()) selectedAnnotationId = null;
        const annotation = selectedAnnotation();
        // The charted day domain, which also bounds the form's date field.
        const firstDay = props.daily[0]?.date;
        const lastDay = props.daily.at(-1)?.date;
        const activeFilterCount = Object.keys(filterModel).length;
        computeDaySessions();

        kpiTiles.update(props.kpis, props.metric);

        if (annotation) {
            const next = h(
                'button',
                { class: 'wa-btn', onclick: () => removeAnnotation(annotation.annotationId) },
                `Remove “${annotation.label}”`
            );
            if (removeButton) removeButton.replaceWith(next);
            else removeButtonHost.prepend(next);
            removeButton = next;
        } else if (removeButton) {
            removeButton.remove();
            removeButton = undefined;
        }

        popover.trigger.disabled = !lastDay;
        if (formDay != null && firstDay && lastDay) {
            if (formView?.key !== formDay.getTime()) {
                formView = {
                    key: formDay.getTime(),
                    view: createEventForm({
                        date: formDay,
                        minDate: firstDay,
                        maxDate: lastDay,
                        onSubmit: addEvent,
                        onCancel: closeEventForm,
                    }),
                };
            }
            // A right-click opens the form at the pointer; the toolbar button anchors it itself.
            popover.setOpen(true, formView.view, formAnchor);
        } else {
            formView = undefined;
            popover.setOpen(false);
        }

        chartBox.setAttribute('aria-labelledby', kpiTabId(props.metric));
        chartSlot.update();
        if (chartSlot.key === 'chart') (chartSlot.view as TrafficChart).update(trafficProps());

        summary.textContent = gridSummary(activeFilterCount);
        clearButton.disabled = activeFilterCount === 0;
        gridSlot.update();
        grid?.update(daySessions);
    }
    renderOnce();

    return {
        el,
        mount() {
            kpiTiles.mount();
            chartSlot.mount();
            gridSlot.mount();
        },
        update(next) {
            props = next;
            render();
        },
        destroy() {
            popover.setOpen(false);
            kpiTiles.destroy();
            chartSlot.destroy();
            gridSlot.destroy();
        },
    };
}
