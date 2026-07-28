import { useCallback, useMemo, useRef, useState } from 'react';

import { type DailyPoint, dailyFromSessions } from '../data';
import { fmtInt } from '../format';
import { METRIC_BY_KEY, type MetricKey } from '../metrics';
import type { Annotation, Session } from '../types';
import { EmptyState } from './EmptyState';
import { type KpiDef, KpiTiles } from './KpiTiles';
import { SessionsGrid, type SessionsGridHandle } from './SessionsGrid';
import { TrafficChart } from './TrafficChart';
import { dayKey, sameDaySet } from './dateFilter';
import { sessionsPassingNonWhenFilters } from './sessionFilter';

interface OverviewViewProps {
    daily: DailyPoint[];
    dailyPrevious: DailyPoint[];
    /** Every session in the selected range — feeds the sessions grid. */
    sessions: Session[];
    /** Every session in the previous range — filtered alongside the current period. */
    prevSessions: Session[];
    annotations: Annotation[];
    kpis: KpiDef[];
    /** The metric currently driving the traffic chart. */
    metric: MetricKey;
    hasData: boolean;
    onMetricSelect: (key: MetricKey) => void;
}

export function OverviewView({
    daily,
    dailyPrevious,
    sessions,
    prevSessions,
    annotations,
    kpis,
    metric,
    hasData,
    onMetricSelect,
}: OverviewViewProps) {
    // Days selected on the traffic chart narrow the sessions grid; empty = whole range.
    const [selectedDays, setSelectedDays] = useState<Date[]>([]);
    // The grid's column filter model (colId → model). Both chart series re-aggregate
    // over the sessions passing it, excluding the When column.
    const [filterModel, setFilterModel] = useState<Record<string, unknown>>({});
    const gridRef = useRef<SessionsGridHandle>(null);
    const metricLabel = METRIC_BY_KEY[metric].axisTitle;

    // The day selection is represented by `selectedDays`, and the grid mirrors it onto
    // the When column, so exclude that column here or it counts twice.
    const activeFilterCount = useMemo(
        () => Object.keys(filterModel).filter((key) => key !== 'timestamp').length + (selectedDays.length > 0 ? 1 : 0),
        [filterModel, selectedDays]
    );

    // Clears the grid's column filters (including When) and the chart selection.
    const clearFilters = useCallback(() => {
        gridRef.current?.clearFilters();
        setSelectedDays([]);
        setFilterModel({});
    }, []);

    // Re-aggregate both series over their original day domains, so the x-axis stays
    // fixed while only the values reflect the active column filters.
    const chartDaily = useMemo(
        () =>
            dailyFromSessions(
                sessionsPassingNonWhenFilters(sessions, filterModel),
                daily.map((d) => d.date.getTime())
            ),
        [sessions, filterModel, daily]
    );
    const chartDailyPrev = useMemo(
        () =>
            dailyFromSessions(
                sessionsPassingNonWhenFilters(prevSessions, filterModel),
                dailyPrevious.map((d) => d.date.getTime())
            ),
        [prevSessions, filterModel, dailyPrevious]
    );

    // Both the chart and the grid feed selected days here; ignore no-op updates so
    // a round-trip (chart→grid or grid→chart) settles instead of looping.
    const setDays = useCallback(
        (days: Date[]) => setSelectedDays((prev) => (sameDaySet(prev, days) ? prev : days)),
        []
    );

    // The rows the grid actually shows: column filters plus the day selection, which
    // the grid applies as a When filter. Keeps the header count honest.
    const gridSessions = useMemo(() => {
        const passing = sessionsPassingNonWhenFilters(sessions, filterModel);
        if (selectedDays.length === 0) return passing;
        const keys = new Set(selectedDays.map(dayKey));
        return passing.filter((s) => keys.has(dayKey(new Date(s.timestamp))));
    }, [sessions, filterModel, selectedDays]);

    return (
        <div className="wa-view">
            <KpiTiles kpis={kpis} activeKey={metric} onSelect={onMetricSelect} />

            <section className="wa-card">
                <div className="wa-card-head">
                    <div>
                        <h2 className="wa-card-title">{metricLabel} over time</h2>
                        <span className="wa-card-sub">
                            Pick a KPI above to change this chart · click or drag across points to filter the sessions
                            below · click empty space to clear
                        </span>
                    </div>
                </div>
                <div className="wa-chart-box">
                    {hasData ? (
                        <TrafficChart
                            metric={metric}
                            daily={chartDaily}
                            dailyPrevious={chartDailyPrev}
                            annotations={annotations}
                            selectedDays={selectedDays}
                            onSelectionChange={setDays}
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
                        <span className="wa-card-sub">
                            {activeFilterCount === 0
                                ? `${fmtInt(sessions.length)} sessions in last ${daily.length} days`
                                : `${fmtInt(gridSessions.length)} out of ${fmtInt(sessions.length)} sessions ` +
                                  `(${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} applied)`}
                        </span>
                    </div>
                    <button className="wa-btn" onClick={clearFilters} disabled={activeFilterCount === 0}>
                        Clear filters
                    </button>
                </div>
                {hasData ? (
                    <SessionsGrid
                        ref={gridRef}
                        sessions={sessions}
                        selectedDays={selectedDays}
                        onFilterDaysChange={setDays}
                        onColumnFiltersChange={setFilterModel}
                    />
                ) : (
                    <EmptyState message="No sessions in this date range" hint="Try widening the range." />
                )}
            </section>
        </div>
    );
}
