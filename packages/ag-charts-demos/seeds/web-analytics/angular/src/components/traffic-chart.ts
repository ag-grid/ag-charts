import { Component, afterRenderEffect, computed, input, output, untracked, viewChild } from '@angular/core';

import { AgCharts } from 'ag-charts-angular';
import type {
    AgAreaSeriesOptions,
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgContextMenuItem,
    AgSelectionItem,
} from 'ag-charts-community';

import { ANNOTATION_COLOR, THEME } from '../chartTheme';
import type { DailyPoint } from '../data';
import { fmtDate } from '../format';
import { METRIC_BY_KEY, type MetricKey } from '../metrics';
import type { Annotation } from '../types';
import { dayKey, sameDaySet, startOfDay } from './dateFilter';
import type { FormAnchor } from './event-form';

function trafficTooltip({
    color,
    dashed,
    date,
    value,
    footer,
}: {
    color: string;
    dashed?: boolean;
    date: Date;
    value: string;
    footer?: string[];
}) {
    const dash = dashed ? ' stroke-dasharray="4 4" stroke-opacity="0.45"' : '';
    const footerRows = (footer ?? [])
        .map((text) => `<span class="ag-charts-tooltip-footer-text">${text}</span>`)
        .join('');
    return `<div class="ag-charts-tooltip-content wa-traffic-tooltip">
                <div class="ag-charts-tooltip-row">
                    <span class="ag-charts-tooltip-symbol"><svg width="20" height="2" viewBox="0 0 20 2">
                        <line x1="0" y1="1" x2="20" y2="1" stroke="${color}" stroke-width="2"${dash} />
                    </svg></span>
                    <span class="ag-charts-tooltip-label">${fmtDate(date)}</span>
                    <span class="ag-charts-tooltip-value">${value}</span>
                </div>
                ${footerRows ? `<div class="ag-charts-tooltip-footer">${footerRows}</div>` : ''}
            </div>`;
}

/** The datum shape shared by both area series. */
interface TrafficDatum {
    date: Date;
    id: string;
}

// Must be a string: the selection API treats a numeric itemId as a raw datum index.
const dayId = (d: Date) => String(d.getTime());

// Fixed series id so selections can be addressed by (seriesId, itemId) via the API.
const SERIES_ID = 'traffic';

/** The React `onAddEventAt(date, anchor?)` arguments as one payload. */
export interface AddEventRequest {
    day: Date;
    anchor?: FormAnchor;
}

/** Viewport position of the right-click, so the form can open where the user clicked. */
function anchorOf(event: Event): FormAnchor | undefined {
    return event instanceof MouseEvent ? { x: event.clientX, y: event.clientY } : undefined;
}

/** Resolves an axis or datum value to the calendar day it falls on. */
function toDay(value: unknown): Date | undefined {
    if (value instanceof Date) return startOfDay(value);
    if (typeof value === 'number' || typeof value === 'string') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? undefined : startOfDay(date);
    }
    return undefined;
}

// Distinct calendar days across the selected items (both series share a date).
const selectionToDays = (items: Iterable<AgSelectionItem<unknown>>): Date[] => {
    const byDay = new Map<number, Date>();
    for (const { datum } of items) {
        // A rebuilt domain can leave selected items whose datum is gone.
        const date = (datum as TrafficDatum | undefined)?.date;
        if (!date) continue;
        const day = startOfDay(date);
        byDay.set(day.getTime(), day);
    }
    return [...byDay.values()];
};

function crossLinesFor(annotations: Annotation[], selectedId: string | null): AgCartesianCrossLineOptions<Date>[] {
    // Cross-lines paint in array order, so the selected one goes last to sit above its neighbours.
    const ordered =
        selectedId == null
            ? annotations
            : [
                  ...annotations.filter((a) => a.annotationId !== selectedId),
                  ...annotations.filter((a) => a.annotationId === selectedId),
              ];

    return ordered.map((annotation) => {
        const selected = annotation.annotationId === selectedId;
        return {
            type: 'line',
            // Identifies the annotation in click and context-menu events.
            id: annotation.annotationId,
            value: annotation.date,
            stroke: ANNOTATION_COLOR[annotation.type],
            strokeWidth: selected ? 2 : 1,
            label: {
                text: annotation.label,
                position: 'top',
                fontSize: 12,
                padding: 4,
                fontWeight: selected ? 'bold' : 'normal',
                color: { ref: 'textColor', mix: 0.3, ontoColor: ANNOTATION_COLOR[annotation.type] },
                fill: { ref: 'chartBackgroundColor', mix: 0.9, ontoColor: ANNOTATION_COLOR[annotation.type] },
                border: {
                    stroke: ANNOTATION_COLOR[annotation.type],
                    strokeWidth: selected ? 2 : 1,
                },
            },
        };
    });
}

/**
 * The traffic-over-time chart. The host is the `.wa-chart-box-lg` tab panel the React version
 * renders the chart into; the chart fills it.
 */
@Component({
    selector: 'div[waTrafficChart]',
    imports: [AgCharts],
    template: '<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class TrafficChart {
    /** The metric shown, driven by the selected KPI tile. */
    readonly metric = input.required<MetricKey>();
    readonly daily = input.required<DailyPoint[]>();
    /** Previous-period series, aligned by index to `daily`. */
    readonly dailyPrevious = input.required<DailyPoint[]>();
    readonly annotations = input.required<Annotation[]>();
    /** The days to show selected on the chart (the shared source of truth). */
    readonly selectedDays = input.required<Date[]>();
    /** The annotation the user has clicked, if any — drawn emphasised. */
    readonly selectedAnnotationId = input.required<string | null>();
    /** Emitted when the user changes the selection on the chart. */
    readonly selectionChange = output<Date[]>();
    /** Emitted with the clicked annotation's id, or null when the click lands elsewhere. */
    readonly annotationSelect = output<string | null>();
    readonly annotationRemove = output<string>();
    /** Emitted from the context menu to open the add-event form on a given day. */
    readonly addEventAt = output<AddEventRequest>();

    private readonly chartComponent = viewChild.required(AgCharts);

    protected readonly options = computed<AgCartesianChartOptions>(() => {
        const def = METRIC_BY_KEY[this.metric()];
        const dailyPrevious = this.dailyPrevious();
        const annotations = this.annotations();
        const data = this.daily().map((d, i) => ({
            date: d.date,
            // Stable per-day id so the selection API can address items by day.
            id: dayId(d.date),
            value: def.daily(d),
            value_prev: dailyPrevious[i] ? def.daily(dailyPrevious[i]) : undefined,
            // The previous series is drawn against the current x, so keep its real date for the tooltip.
            date_prev: dailyPrevious[i]?.date,
        }));

        const series: AgAreaSeriesOptions[] = [
            {
                type: 'area',
                xKey: 'date',
                yKey: 'value_prev',
                yName: `Previous period`,
                fill: def.color,
                fillOpacity: 0,
                stroke: def.color,
                strokeWidth: 1.5,
                strokeOpacity: 0.45,
                marker: {
                    fill: def.color,
                    size: 12,
                },
                lineDash: [4, 4],
                selection: {
                    enabled: false,
                },
                highlight: {
                    enabled: false,
                },
                tooltip: {
                    renderer: ({ datum, yKey }) =>
                        trafficTooltip({
                            color: def.color,
                            dashed: true,
                            date: datum.date_prev,
                            value: def.formatValue(datum[yKey]),
                        }),
                },
            },
            {
                type: 'area',
                id: SERIES_ID,
                xKey: 'date',
                yKey: 'value',
                yName: 'Current period',
                fill: {
                    type: 'gradient',
                    colorStops: [
                        { color: { ref: 'chartBackgroundColor' } },
                        { color: { ref: 'chartBackgroundColor', mix: 0.7, ontoColor: def.color } },
                        { color: def.color },
                    ],
                },
                fillOpacity: 0.5,
                stroke: def.color,
                strokeWidth: 2.5,
                marker: {
                    fill: def.color,
                    size: 12,
                    stroke: def.color,
                    strokeWidth: 0,
                },
                selection: {
                    selectedItem: {
                        fill: def.color,
                        fillOpacity: 1,
                    },
                    unselectedItem: {
                        opacity: 1,
                    },
                    unselectedSeries: {
                        opacity: 1,
                    },
                },
                highlight: {
                    highlightedItem: {
                        fill: { ref: 'chartBackgroundColor', mix: 0.9, ontoColor: def.color },
                        strokeWidth: 3,
                    },
                },
                tooltip: {
                    renderer: ({ datum, xKey, yKey }) =>
                        trafficTooltip({
                            color: def.color,
                            date: datum[xKey],
                            value: def.formatValue(datum[yKey]),
                            footer: ['Click on marker to view sessions.', 'Right-click to add an event.'],
                        }),
                },
            },
        ];

        return {
            theme: THEME,
            data,
            // Identify data rows by day so selection survives metric/data updates.
            dataIdKey: 'id',
            series,
            axes: {
                x: {
                    type: 'time',
                    position: 'bottom',
                    label: { format: '%b %d' },
                    crossLines: crossLinesFor(annotations, this.selectedAnnotationId()),
                    nice: false,
                    crosshair: { enabled: true, lineDash: [4, 4] },
                },
                y: {
                    type: 'number',
                    position: 'left',
                    label: { formatter: ({ value }) => def.formatValue(value) },
                    title: { text: def.axisTitle, fontStyle: 'italic' },
                },
            },
            padding: { top: 8, right: 8, bottom: 0, left: 0 },
            tooltip: {
                position: {
                    yOffset: -24,
                },
                mode: 'shared',
            },
            legend: {
                reverseOrder: true,
            },
            selection: {
                enabled: true,
                enableDrag: true,
            },
            contextMenu: {
                getItems: ({ allShowOnParams, coordinates }) => {
                    const crossLine = allShowOnParams.find((p) => p.showOn === 'cross-line');
                    if (crossLine) {
                        const annotation = annotations.find((a) => a.annotationId === crossLine.crossLineId);
                        if (!annotation) return undefined;
                        const items: AgContextMenuItem[] = [
                            {
                                showOn: 'cross-line',
                                label: `Remove "${annotation.label}"`,
                                action: () => this.annotationRemove.emit(annotation.annotationId),
                            },
                        ];
                        return items;
                    }

                    // A datum node names its own day; anywhere else in the series area the
                    // crosshair's x-coordinate does.
                    const node = allShowOnParams.find((p) => p.showOn === 'series-node');
                    const day = node ? toDay((node.datum as TrafficDatum).date) : toDay(coordinates?.x?.value);
                    if (!day) return undefined;
                    const label = `Add event on ${fmtDate(day)}`;
                    const addEventAt = (event: Event) => this.addEventAt.emit({ day, anchor: anchorOf(event) });
                    const addItem: AgContextMenuItem = node
                        ? { showOn: 'series-node', label, action: (ev) => addEventAt(ev.event) }
                        : { showOn: 'series-area', label, action: (ev) => addEventAt(ev.event) };
                    return [addItem];
                },
            },
            listeners: {
                selectionChange: ({ source }) => {
                    // Ignore our own api-call echoes; only user interaction should push a new selection upward.
                    if (source === 'api-call') return;
                    // A cross-line click never reaches here, so clearing the annotation cannot drop a fresh one.
                    this.annotationSelect.emit(null);
                    this.selectionChange.emit(selectionToDays(this.chart?.getSelection() ?? []));
                },
                // Fires on every datum click, including a re-click that leaves the selection unchanged.
                seriesNodeClick: () => this.annotationSelect.emit(null),
                crossLineClick: ({ crossLineId }) => this.annotationSelect.emit(crossLineId),
                // Only an empty-area click reaches here; cross-line and datum clicks return before chart listeners.
                click: () => this.annotationSelect.emit(null),
            },
        };
    });

    // Signature of the day domain, not the values, so filter-driven re-aggregation is not a range change.
    private readonly domainKey = computed(() => {
        const daily = this.daily();
        return daily.length > 0 ? `${daily[0].date.getTime()}:${daily.at(-1)!.date.getTime()}:${daily.length}` : '';
    });

    private get chart() {
        return this.chartComponent().chart;
    }

    constructor() {
        // Both React effects run after render, once the wrapper has applied the options above, so
        // they are after-render effects here too.

        // Driven from the shared source of truth; skips when already in sync, breaking the chart->state->chart loop.
        // A rebuilt domain re-asserts it, since the redrawn series may not have kept the selection.
        afterRenderEffect(() => {
            const selectedDays = this.selectedDays();
            this.metric();
            this.domainKey();
            const chart = this.chart;
            if (!chart) return;
            if (sameDaySet(selectionToDays(chart.getSelection() ?? []), selectedDays)) return;
            if (selectedDays.length === 0) {
                chart.clearSelection();
            } else {
                chart.setSelection(selectedDays.map((d) => ({ seriesId: SERIES_ID, itemId: dayId(d) })));
            }
        });

        // Drop only the days the rebuilt domain no longer holds, so widening a range keeps the
        // selection. Skips the initial mount so the entry animation survives.
        // Inputs are not readable in the constructor, so the mount-time key is taken on the first run.
        let mountedDomain: string | undefined;
        afterRenderEffect(() => {
            const domainKey = this.domainKey();
            if (mountedDomain === undefined || mountedDomain === domainKey) {
                mountedDomain = domainKey;
                return;
            }
            const domainDays = new Set(untracked(this.daily).map((d) => dayKey(d.date)));
            this.selectionChange.emit(untracked(this.selectedDays).filter((d) => domainDays.has(dayKey(d))));
        });
    }
}
