import { CdkConnectedOverlay, type ConnectedOverlayPositionChange, type ConnectedPosition } from '@angular/cdk/overlay';
import { Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';

import type { DailyPoint } from '../data';
import { fmtInt } from '../format';
import type { MetricKey } from '../metrics';
import type { Annotation, AnnotationType, Session } from '../types';
import { dayKey, sameDaySet } from './dateFilter';
import { EmptyState } from './empty-state';
import { EventForm, type EventFormValue, type FormAnchor } from './event-form';
import { type KpiDef, KpiTiles, kpiTabId } from './kpi-tiles';
import { type GridState, SessionsGrid } from './sessions-grid';
import { type AddEventRequest, TrafficChart } from './traffic-chart';

/** The React `onAnnotationAdd(date, label, type)` arguments as one payload. */
export type AnnotationAdd = EventFormValue;

let nextPopoverId = 0;

const POPOVER_POSITIONS: ConnectedPosition[] = [
    // Radix `side="bottom" align="end" sideOffset={6}`, with the fallback above.
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6 },
];

@Component({
    selector: 'div[waOverviewView]',
    imports: [CdkConnectedOverlay, EmptyState, EventForm, KpiTiles, SessionsGrid, TrafficChart],
    host: { class: 'wa-view' },
    template: `
        <section class="wa-card wa-card--tabbed">
            <div waKpiTiles [kpis]="kpis()" [activeKey]="metric()" (select)="metricSelect.emit($event)"></div>
            <div class="wa-card-head">
                <div>
                    <h2 class="wa-card-title">Traffic over time</h2>
                </div>
                <div class="wa-card-actions">
                    @if (selectedAnnotation(); as annotation) {
                        <button class="wa-btn" (click)="removeAnnotation(annotation.annotationId)"
                            >Remove “{{ annotation.label }}”</button
                        >
                    }
                    <button
                        #addEventTrigger
                        type="button"
                        aria-haspopup="dialog"
                        [attr.aria-expanded]="formOpen()"
                        [attr.aria-controls]="formOpen() ? popoverId : null"
                        [attr.data-state]="formOpen() ? 'open' : 'closed'"
                        class="wa-btn wa-btn--secondary"
                        [disabled]="!lastDay()"
                        (click)="toggleEventForm()"
                        >Add event</button
                    >
                    <ng-template
                        cdkConnectedOverlay
                        [cdkConnectedOverlayOrigin]="popoverOrigin()"
                        [cdkConnectedOverlayOpen]="formOpen()"
                        [cdkConnectedOverlayPositions]="popoverPositions"
                        [cdkConnectedOverlayViewportMargin]="8"
                        (positionChange)="onPopoverPositionChange($event)"
                        (overlayOutsideClick)="closeEventForm()"
                        (overlayKeydown)="onPopoverKeydown($event)"
                    >
                        <div
                            [id]="popoverId"
                            [attr.data-side]="popoverSide()"
                            data-align="end"
                            data-state="open"
                            role="dialog"
                            class="wa-portal"
                            tabindex="-1"
                        >
                            @for (day of formDays(); track day.getTime()) {
                                <form
                                    waEventForm
                                    [date]="day"
                                    [minDate]="firstDay()!"
                                    [maxDate]="lastDay()!"
                                    (submitted)="addEvent($event)"
                                    (cancel)="closeEventForm()"
                                ></form>
                            }
                        </div>
                    </ng-template>
                </div>
            </div>
            @if (hasData()) {
                <div
                    waTrafficChart
                    class="wa-chart-box-lg"
                    role="tabpanel"
                    [attr.aria-labelledby]="kpiTabId(metric())"
                    [metric]="metric()"
                    [daily]="daily()"
                    [dailyPrevious]="dailyPrevious()"
                    [annotations]="annotations()"
                    [selectedDays]="selectedDays()"
                    (selectionChange)="setDays($event)"
                    [selectedAnnotationId]="selectedAnnotation()?.annotationId ?? null"
                    (annotationSelect)="selectAnnotation($event)"
                    (annotationRemove)="removeAnnotation($event)"
                    (addEventAt)="openEventForm($event.day, $event.anchor)"
                ></div>
            } @else {
                <div class="wa-chart-box-lg" role="tabpanel" [attr.aria-labelledby]="kpiTabId(metric())">
                    <div waEmptyState message="No sessions in this date range" hint="Try widening the range."></div>
                </div>
            }
        </section>

        <section class="wa-card">
            <div class="wa-card-head">
                <div>
                    <h2 class="wa-card-title">Sessions</h2>
                    <span class="wa-card-sub">{{ gridSummary() }}</span>
                </div>
                <button class="wa-btn" (click)="clearFilters()" [disabled]="activeFilterCount() === 0"
                    >Clear filters</button
                >
            </div>
            @if (hasData()) {
                <div waSessionsGrid [sessions]="daySessions()" (gridStateChange)="onGridStateChange($event)"></div>
            } @else {
                <div waEmptyState message="No sessions in this date range" hint="Try widening the range."></div>
            }
        </section>
    `,
})
export class OverviewView {
    readonly daily = input.required<DailyPoint[]>();
    readonly dailyPrevious = input.required<DailyPoint[]>();
    /** Every session in the selected range — feeds the sessions grid. */
    readonly sessions = input.required<Session[]>();
    readonly annotations = input.required<Annotation[]>();
    readonly kpis = input.required<KpiDef[]>();
    /** The metric currently driving the traffic chart. */
    readonly metric = input.required<MetricKey>();
    readonly hasData = input.required<boolean>();
    readonly metricSelect = output<MetricKey>();
    readonly annotationAdd = output<AnnotationAdd>();
    readonly annotationRemove = output<string>();

    protected readonly kpiTabId = kpiTabId;
    protected readonly popoverId = `wa-popover-${nextPopoverId++}`;
    protected readonly popoverPositions = POPOVER_POSITIONS;

    // Days selected on the traffic chart narrow the sessions grid; empty = whole range.
    protected readonly selectedDays = signal<Date[]>([]);
    // Reported back by the grid; feeds the card's count and never reaches the chart.
    private readonly filterModel = signal<Record<string, unknown>>({});
    private readonly displayedRowCount = signal(0);
    private readonly grid = viewChild(SessionsGrid);
    // Clicked annotation, and the day the add-event form is open on (null = closed).
    private readonly selectedAnnotationId = signal<string | null>(null);
    private readonly formDay = signal<Date | null>(null);
    // Where the form opens: the right-clicked point, or under the toolbar button.
    private readonly formAnchor = signal<FormAnchor | undefined>(undefined);
    private readonly addEventTrigger = viewChild.required<ElementRef<HTMLButtonElement>>('addEventTrigger');

    protected readonly selectedAnnotation = computed(() =>
        this.annotations().find((a) => a.annotationId === this.selectedAnnotationId())
    );

    // The charted day domain, which also bounds the form's date field.
    protected readonly firstDay = computed(() => this.daily()[0]?.date);
    protected readonly lastDay = computed(() => this.daily().at(-1)?.date);

    protected readonly formOpen = computed(() => this.formDay() != null);
    /** The side of the anchor the popover settled on: below unless it had to flip. */
    protected readonly popoverSide = signal<'bottom' | 'top'>('bottom');
    // The React `key={formDay.getTime()}`: a keyed `@for` over the one open day remounts the form afresh
    // when it reopens on another day.
    protected readonly formDays = computed(() => {
        const day = this.formDay();
        return day != null && this.firstDay() && this.lastDay() ? [day] : [];
    });
    // A right-click opens the form at the pointer; the toolbar button anchors it itself.
    protected readonly popoverOrigin = computed(() => {
        const anchor = this.formAnchor();
        return anchor ? { x: anchor.x, y: anchor.y } : this.addEventTrigger();
    });

    protected readonly activeFilterCount = computed(() => Object.keys(this.filterModel()).length);

    // The grid's row data, which its column filters then narrow.
    protected readonly daySessions = computed(() => {
        const selectedDays = this.selectedDays();
        if (selectedDays.length === 0) return [];
        const keys = new Set(selectedDays.map(dayKey));
        return this.sessions().filter((s) => keys.has(dayKey(new Date(s.timestamp))));
    });

    protected readonly gridSummary = computed(() => {
        const selectedDays = this.selectedDays();
        if (selectedDays.length === 0) {
            return `No days selected.`;
        }
        const days = `${selectedDays.length} selected ${selectedDays.length === 1 ? 'day' : 'days'}`;
        const activeFilterCount = this.activeFilterCount();
        const daySessions = this.daySessions();
        if (activeFilterCount === 0) return `${fmtInt(daySessions.length)} sessions on ${days}`;
        return (
            `${fmtInt(this.displayedRowCount())} out of ${fmtInt(daySessions.length)} sessions on ${days} ` +
            `(${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} applied)`
        );
    });

    constructor() {
        // Dropping out of the date range deselects for good, so widening it again does not resurrect it.
        effect(() => {
            if (this.selectedAnnotationId() != null && !this.selectedAnnotation()) this.selectedAnnotationId.set(null);
        });
    }

    protected onGridStateChange({ filterModel, displayedRowCount }: GridState): void {
        this.filterModel.set(filterModel);
        this.displayedRowCount.set(displayedRowCount);
    }

    // Clicking the selected annotation again deselects it.
    protected selectAnnotation(annotationId: string | null): void {
        this.selectedAnnotationId.update((prev) =>
            annotationId != null && annotationId === prev ? null : annotationId
        );
    }

    protected removeAnnotation(annotationId: string): void {
        this.selectedAnnotationId.update((prev) => (prev === annotationId ? null : prev));
        this.annotationRemove.emit(annotationId);
    }

    protected openEventForm(day: Date, anchor?: FormAnchor): void {
        this.formDay.set(day);
        this.formAnchor.set(anchor);
    }

    protected closeEventForm(): void {
        this.formDay.set(null);
    }

    /** The Radix trigger: opens on the last charted day, or closes. */
    protected toggleEventForm(): void {
        const lastDay = this.lastDay();
        if (!this.formOpen() && lastDay) this.openEventForm(lastDay);
        else this.closeEventForm();
    }

    protected onPopoverPositionChange(change: ConnectedOverlayPositionChange): void {
        this.popoverSide.set(change.connectionPair.overlayY === 'top' ? 'bottom' : 'top');
    }

    /** Radix closes on Escape and hands focus back to the trigger; an outside click closes without it. */
    protected onPopoverKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        this.closeEventForm();
        this.addEventTrigger().nativeElement.focus();
    }

    protected addEvent(value: EventFormValue): void {
        this.formDay.set(null);
        this.annotationAdd.emit(value);
    }

    // Only the column filters; the chart selection is cleared by clicking empty chart space.
    protected clearFilters(): void {
        this.grid()?.clearFilters();
    }

    // Ignore no-op updates so re-selecting the same days does not churn the grid's row data.
    protected setDays(days: Date[]): void {
        this.selectedDays.update((prev) => (sameDaySet(prev, days) ? prev : days));
    }
}
