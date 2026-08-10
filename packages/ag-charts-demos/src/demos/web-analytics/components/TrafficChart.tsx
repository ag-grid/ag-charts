import { useEffect, useMemo, useRef } from 'react';

import type {
    AgAreaSeriesOptions,
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartInstance,
    AgSelectionItem,
} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { ANNOTATION_COLOR, THEME } from '../chartTheme';
import type { DailyPoint } from '../data';
import { fmtDate } from '../format';
import { METRIC_BY_KEY, type MetricKey } from '../metrics';
import type { Annotation } from '../types';
import { sameDaySet, startOfDay } from './dateFilter';

/** The datum shape plotted by both area series. */
interface TrafficDatum {
    date: Date;
    id: string;
}

// A datum's `dataIdKey` value. Must be a string: the selection API treats a numeric
// itemId as a raw datum index rather than looking it up by id.
const dayId = (d: Date) => String(d.getTime());

// Fixed series id so selections can be addressed by (seriesId, itemId) via the API.
const SERIES_ID = 'traffic';

interface TrafficChartProps {
    /** The metric to plot, driven by the selected KPI tile. */
    metric: MetricKey;
    daily: DailyPoint[];
    /** Previous-period series, aligned by index to `daily`. */
    dailyPrevious: DailyPoint[];
    annotations: Annotation[];
    /** The days to show selected on the chart (the shared source of truth). */
    selectedDays: Date[];
    /** Called when the user changes the selection on the chart. */
    onSelectionChange: (days: Date[]) => void;
}

// Distinct calendar days across the selected items (both series share a date).
const selectionToDays = (items: Iterable<AgSelectionItem<unknown>>): Date[] => {
    const byDay = new Map<number, Date>();
    for (const { datum } of items) {
        const day = startOfDay((datum as TrafficDatum).date);
        byDay.set(day.getTime(), day);
    }
    return [...byDay.values()];
};

function crossLinesFor(annotations: Annotation[]): AgCartesianCrossLineOptions<Date>[] {
    return annotations.map((annotation) => ({
        type: 'line',
        value: annotation.date,
        stroke: ANNOTATION_COLOR[annotation.type],
        strokeWidth: 1,
        label: {
            text: annotation.label,
            position: annotation.type === 'deploy' ? 'bottom' : 'top',
            fontSize: 11,
            fontStyle: 'italic',
            color: ANNOTATION_COLOR[annotation.type],
        },
    }));
}

export function TrafficChart({
    metric,
    daily,
    dailyPrevious,
    annotations,
    selectedDays,
    onSelectionChange,
}: TrafficChartProps) {
    const chartRef = useRef<AgChartInstance | null>(null);

    const options = useMemo<AgCartesianChartOptions>(() => {
        const def = METRIC_BY_KEY[metric];
        const data = daily.map((d, i) => ({
            date: d.date,
            // Stable per-day id so the selection API can address items by day.
            id: dayId(d.date),
            value: def.daily(d),
            value_prev: dailyPrevious[i] ? def.daily(dailyPrevious[i]) : undefined,
            // The previous series plots against `date` (current x), so keep its real
            // date for the tooltip.
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
                    renderer: ({ datum, yKey }) => ({
                        heading: '',
                        data: [
                            {
                                label: fmtDate(datum.date_prev),
                                value: `${def.formatValue(datum[yKey])}`,
                            },
                        ],
                    }),
                },
            },
            {
                type: 'area',
                id: SERIES_ID,
                xKey: 'date',
                yKey: 'value',
                yName: 'Current period',
                fill: def.color,
                fillOpacity: 0.15,
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
                    renderer: ({ datum, xKey, yKey }) => ({
                        heading: '',
                        data: [
                            {
                                label: fmtDate(datum[xKey]),
                                value: `${def.formatValue(datum[yKey])}`,
                            },
                        ],
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
                    crossLines: crossLinesFor(annotations),
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
            listeners: {
                selectionChange: ({ source }) => {
                    // Ignore our own `setSelection`/`clearSelection` (api-call) echoes;
                    // only user interaction should push a new selection upward.
                    if (source === 'api-call') return;
                    onSelectionChange(selectionToDays(chartRef.current?.getSelection() ?? []));
                },
            },
        };
    }, [metric, daily, dailyPrevious, annotations, onSelectionChange]);

    // Drive the chart selection from the shared source of truth (chart clicks, grid
    // filter edits, metric switches all flow through here). Skips when already in
    // sync, which breaks the chart→state→chart loop.
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;
        if (sameDaySet(selectionToDays(chart.getSelection() ?? []), selectedDays)) return;
        if (selectedDays.length === 0) {
            chart.clearSelection();
        } else {
            chart.setSelection(selectedDays.map((d) => ({ seriesId: SERIES_ID, itemId: dayId(d) })));
        }
    }, [selectedDays, metric]);

    // Signature of the day domain (not the values), so filter-driven re-aggregation
    // doesn't count as a range change.
    const domainKey =
        daily.length > 0 ? `${daily[0].date.getTime()}:${daily.at(-1)!.date.getTime()}:${daily.length}` : '';

    // A date-range change rebuilds the domain; drop any selection that no longer
    // applies. Skip the initial mount so the forced redraw from `clearSelection`
    // doesn't cancel the chart's entry animation.
    const mountedDomain = useRef(domainKey);
    useEffect(() => {
        if (mountedDomain.current === domainKey) return;
        mountedDomain.current = domainKey;
        chartRef.current?.clearSelection();
        onSelectionChange([]);
    }, [domainKey, onSelectionChange]);

    return <AgCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
