import { useCallback, useMemo, useRef, useState } from 'react';

import type { DailyPoint } from '../data';
import { fmtInt } from '../format';
import type { MetricKey } from '../metrics';
import type { Annotation, AnnotationType, Session } from '../types';
import { EmptyState } from './EmptyState';
import { EventForm, type FormAnchor } from './EventForm';
import { type KpiDef, KpiTiles, kpiTabId } from './KpiTiles';
import { SessionsGrid, type SessionsGridHandle } from './SessionsGrid';
import { TrafficChart } from './TrafficChart';
import { dayKey, sameDaySet } from './dateFilter';

interface OverviewViewProps {
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

export function OverviewView({
    daily,
    dailyPrevious,
    sessions,
    annotations,
    kpis,
    metric,
    hasData,
    onMetricSelect,
    onAnnotationAdd,
    onAnnotationRemove,
}: OverviewViewProps) {
    // Days selected on the traffic chart narrow the sessions grid; empty = whole range.
    const [selectedDays, setSelectedDays] = useState<Date[]>([]);
    // Reported back by the grid; feeds the card's count and never reaches the chart.
    const [filterModel, setFilterModel] = useState<Record<string, unknown>>({});
    const gridRef = useRef<SessionsGridHandle>(null);
    const [displayedRowCount, setDisplayedRowCount] = useState(0);
    const onGridStateChange = useCallback((model: Record<string, unknown>, rowCount: number) => {
        setFilterModel(model);
        setDisplayedRowCount(rowCount);
    }, []);
    // Clicked annotation, and the day the add-event form is open on (null = closed).
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [formDay, setFormDay] = useState<Date | null>(null);
    // Where the form opens: the right-clicked point, or under the toolbar button.
    const [formAnchor, setFormAnchor] = useState<FormAnchor | undefined>();

    const selectedAnnotation = annotations.find((a) => a.annotationId === selectedAnnotationId);
    // The charted day domain, which also bounds the form's date field.
    const firstDay = daily[0]?.date;
    const lastDay = daily.at(-1)?.date;

    // Clicking the selected annotation again deselects it.
    const selectAnnotation = useCallback(
        (annotationId: string | null) =>
            setSelectedAnnotationId((prev) => (annotationId != null && annotationId === prev ? null : annotationId)),
        []
    );

    const removeAnnotation = useCallback(
        (annotationId: string) => {
            setSelectedAnnotationId((prev) => (prev === annotationId ? null : prev));
            onAnnotationRemove(annotationId);
        },
        [onAnnotationRemove]
    );

    const openEventForm = useCallback((day: Date, anchor?: FormAnchor) => {
        setFormDay(day);
        setFormAnchor(anchor);
    }, []);

    const addEvent = useCallback(
        (date: Date, label: string, type: AnnotationType) => {
            setFormDay(null);
            onAnnotationAdd(date, label, type);
        },
        [onAnnotationAdd]
    );

    const activeFilterCount = useMemo(() => Object.keys(filterModel).length, [filterModel]);

    // Only the column filters; the chart selection is cleared by clicking empty chart space.
    const clearFilters = useCallback(() => gridRef.current?.clearFilters(), []);

    // Ignore no-op updates so re-selecting the same days does not churn the grid's row data.
    const setDays = useCallback(
        (days: Date[]) => setSelectedDays((prev) => (sameDaySet(prev, days) ? prev : days)),
        []
    );

    // The grid's row data, which its column filters then narrow.
    const daySessions = useMemo(() => {
        if (selectedDays.length === 0) return [];
        const keys = new Set(selectedDays.map(dayKey));
        return sessions.filter((s) => keys.has(dayKey(new Date(s.timestamp))));
    }, [sessions, selectedDays]);

    const gridSummary = useMemo(() => {
        if (selectedDays.length === 0) {
            return `No days selected.`;
        }
        const days = `${selectedDays.length} selected ${selectedDays.length === 1 ? 'day' : 'days'}`;
        if (activeFilterCount === 0) return `${fmtInt(daySessions.length)} sessions on ${days}`;
        return (
            `${fmtInt(displayedRowCount)} out of ${fmtInt(daySessions.length)} sessions on ${days} ` +
            `(${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} applied)`
        );
    }, [selectedDays, activeFilterCount, daySessions, displayedRowCount]);

    return (
        <div className="wa-view wa-view--overview">
            <section className="wa-card wa-card--tabbed">
                <KpiTiles kpis={kpis} activeKey={metric} onSelect={onMetricSelect} />
                <div className="wa-card-head">
                    <div>
                        <h2 className="wa-card-title">Traffic over time</h2>
                    </div>
                    <div className="wa-card-actions">
                        {selectedAnnotation && (
                            <button
                                className="wa-btn"
                                onClick={() => removeAnnotation(selectedAnnotation.annotationId)}
                            >
                                Remove &ldquo;{selectedAnnotation.label}&rdquo;
                            </button>
                        )}
                        <button
                            className="wa-btn wa-btn--secondary"
                            disabled={!lastDay}
                            aria-expanded={formDay != null}
                            onClick={() => (formDay == null && lastDay ? openEventForm(lastDay) : setFormDay(null))}
                        >
                            Add event
                        </button>
                        {formDay != null && firstDay && lastDay && (
                            <EventForm
                                // Reopening on another day starts the form afresh.
                                key={formDay.getTime()}
                                date={formDay}
                                minDate={firstDay}
                                maxDate={lastDay}
                                anchor={formAnchor}
                                onSubmit={addEvent}
                                onCancel={() => setFormDay(null)}
                            />
                        )}
                    </div>
                </div>
                <div className="wa-chart-box-lg" role="tabpanel" aria-labelledby={kpiTabId(metric)}>
                    {hasData ? (
                        <TrafficChart
                            metric={metric}
                            daily={daily}
                            dailyPrevious={dailyPrevious}
                            annotations={annotations}
                            selectedDays={selectedDays}
                            onSelectionChange={setDays}
                            selectedAnnotationId={selectedAnnotation?.annotationId ?? null}
                            onAnnotationSelect={selectAnnotation}
                            onAnnotationRemove={removeAnnotation}
                            onAddEventAt={openEventForm}
                        />
                    ) : (
                        <EmptyState message="No sessions in this date range" hint="Try widening the range." />
                    )}
                </div>
            </section>

            <section className="wa-card">
                <div className="wa-card-head">
                    <div>
                        <h2 className="wa-card-title">Sessions</h2>
                        <span className="wa-card-sub">{gridSummary}</span>
                    </div>
                    <button className="wa-btn" onClick={clearFilters} disabled={activeFilterCount === 0}>
                        Clear filters
                    </button>
                </div>
                {hasData ? (
                    <SessionsGrid ref={gridRef} sessions={daySessions} onGridStateChange={onGridStateChange} />
                ) : (
                    <EmptyState message="No sessions in this date range" hint="Try widening the range." />
                )}
            </section>
        </div>
    );
}
