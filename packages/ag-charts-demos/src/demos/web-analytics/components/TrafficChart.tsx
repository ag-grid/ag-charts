import { useEffect, useMemo, useRef } from 'react';

import type {
    AgAreaSeriesOptions,
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartInstance,
    AgContextMenuItem,
    AgSelectionItem,
} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { ANNOTATION_COLOR, THEME } from '../chartTheme';
import type { DailyPoint } from '../data';
import { fmtDate } from '../format';
import { METRIC_BY_KEY, type MetricKey } from '../metrics';
import type { Annotation } from '../types';
import type { FormAnchor } from './EventForm';
import { dayKey, sameDaySet, startOfDay } from './dateFilter';

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
                ${footerRows === '' ? '' : `<div class="ag-charts-tooltip-footer">${footerRows}</div>`}
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

interface TrafficChartProps {
    /** The metric shown, driven by the selected KPI tile. */
    metric: MetricKey;
    daily: DailyPoint[];
    /** Previous-period series, aligned by index to `daily`. */
    dailyPrevious: DailyPoint[];
    annotations: Annotation[];
    /** The days to show selected on the chart (the shared source of truth). */
    selectedDays: Date[];
    /** Called when the user changes the selection on the chart. */
    onSelectionChange: (days: Date[]) => void;
    /** The annotation the user has clicked, if any — drawn emphasised. */
    selectedAnnotationId: string | null;
    /** Called with the clicked annotation's id, or null when the click lands elsewhere. */
    onAnnotationSelect: (annotationId: string | null) => void;
    onAnnotationRemove: (annotationId: string) => void;
    /** Called from the context menu to open the add-event form on a given day. */
    onAddEventAt: (date: Date, anchor?: FormAnchor) => void;
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

export function TrafficChart({
    metric,
    daily,
    dailyPrevious,
    annotations,
    selectedDays,
    onSelectionChange,
    selectedAnnotationId,
    onAnnotationSelect,
    onAnnotationRemove,
    onAddEventAt,
}: TrafficChartProps) {
    const chartRef = useRef<AgChartInstance | null>(null);
    const options = useMemo<AgCartesianChartOptions>(() => {
        const def = METRIC_BY_KEY[metric];
        const data = daily.map((d, i) => ({
            date: d.date,
            // Stable per-day id so the selection API can address items by day.
            id: dayId(d.date),
            value: def.daily(d),
            value_prev: dailyPrevious[i] == null ? undefined : def.daily(dailyPrevious[i]),
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
                },
                selection: {
                    selectedItem: {
                        fillOpacity: 1,
                        stroke: def.color,
                    },
                    unselectedItem: {
                        opacity: 0.8,
                    },
                    unselectedSeries: {
                        opacity: 1,
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
                    crossLines: crossLinesFor(annotations, selectedAnnotationId),
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
                                action: () => onAnnotationRemove(annotation.annotationId),
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
                    const addItem: AgContextMenuItem = node
                        ? { showOn: 'series-node', label, action: (ev) => onAddEventAt(day, anchorOf(ev.event)) }
                        : { showOn: 'series-area', label, action: (ev) => onAddEventAt(day, anchorOf(ev.event)) };
                    return [addItem];
                },
            },
            listeners: {
                selectionChange: ({ source }) => {
                    // Ignore our own api-call echoes; only user interaction should push a new selection upward.
                    if (source === 'api-call') return;
                    // A cross-line click never reaches here, so clearing the annotation cannot drop a fresh one.
                    onAnnotationSelect(null);
                    onSelectionChange(selectionToDays(chartRef.current?.getSelection() ?? []));
                },
                // Fires on every datum click, including a re-click that leaves the selection unchanged.
                seriesNodeClick: () => onAnnotationSelect(null),
                crossLineClick: ({ crossLineId }) => onAnnotationSelect(crossLineId),
                // Only an empty-area click reaches here; cross-line and datum clicks return before chart listeners.
                click: () => onAnnotationSelect(null),
            },
        };
    }, [
        metric,
        daily,
        dailyPrevious,
        annotations,
        selectedAnnotationId,
        onSelectionChange,
        onAnnotationSelect,
        onAnnotationRemove,
        onAddEventAt,
    ]);

    // Signature of the day domain, not the values, so filter-driven re-aggregation is not a range change.
    const domainKey =
        daily.length > 0 ? `${daily[0].date.getTime()}:${daily.at(-1)!.date.getTime()}:${daily.length}` : '';

    // Driven from the shared source of truth; skips when already in sync, breaking the chart->state->chart loop.
    // A rebuilt domain re-asserts it, since the redrawn series may not have kept the selection.
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;
        if (sameDaySet(selectionToDays(chart.getSelection() ?? []), selectedDays)) return;
        if (selectedDays.length === 0) {
            chart.clearSelection();
        } else {
            chart.setSelection(selectedDays.map((d) => ({ seriesId: SERIES_ID, itemId: dayId(d) })));
        }
    }, [selectedDays, metric, domainKey]);

    // Drop only the days the rebuilt domain no longer holds, so widening a range keeps the
    // selection. Skips the initial mount so the entry animation survives.
    const mountedDomain = useRef(domainKey);
    useEffect(() => {
        if (mountedDomain.current === domainKey) return;
        mountedDomain.current = domainKey;
        const domainDays = new Set(daily.map((d) => dayKey(d.date)));
        onSelectionChange(selectedDays.filter((d) => domainDays.has(dayKey(d))));
    }, [domainKey, daily, selectedDays, onSelectionChange]);

    return <AgCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
