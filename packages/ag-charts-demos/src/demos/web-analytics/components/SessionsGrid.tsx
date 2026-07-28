import type { ColDef, FilterChangedEvent, GridApi, GridReadyEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

import { fmtCurrency, fmtDateTime, fmtDuration } from '../format';
import type { Session } from '../types';
import { buildDateFilterModel, dateFilterModelToDays, sameDaySet, startOfDay } from './dateFilter';
import { baseColDef, gridTheme } from './grid';

interface SessionsGridProps {
    sessions: Session[];
    /** Days selected on the traffic chart, applied as a filter on the When column. */
    selectedDays: Date[];
    /** Called when the user edits the When column filter, with the days it now selects. */
    onFilterDaysChange: (days: Date[]) => void;
    /** Called with the grid's column filter model (colId → model) whenever it changes. */
    onColumnFiltersChange: (filterModel: Record<string, unknown>) => void;
}

export interface SessionsGridHandle {
    /** Clears every column filter, including the When column driving the chart selection. */
    clearFilters: () => void;
}

// Session-level detail for the selected range. The When column's date filter and
// the traffic chart selection are kept in sync: a chart selection sets the filter,
// and editing the filter updates the chart (both via the shared `selectedDays`).
export const SessionsGrid = forwardRef<SessionsGridHandle, SessionsGridProps>(function SessionsGrid(
    { sessions, selectedDays, onFilterDaysChange, onColumnFiltersChange },
    ref
) {
    const apiRef = useRef<GridApi<Session> | null>(null);
    // Guards the filter-change handler from reacting to our own programmatic writes.
    const applyingFilter = useRef(false);
    const defaultColDef = useMemo(() => baseColDef<Session>(), []);

    // Emit the current column filter model so the traffic chart can re-aggregate
    // both its series (current and previous period) on the sessions that pass it.
    const emitFilterModel = useCallback(
        (api: GridApi<Session>) => onColumnFiltersChange(api.getFilterModel()),
        [onColumnFiltersChange]
    );

    // Push the current selection into the When column filter, so the grid header
    // shows it applied and the user can inspect it. Skips when the filter already
    // selects those days, which also breaks the filter→chart→filter feedback loop.
    const applyDateFilter = useCallback((api: GridApi<Session>, days: Date[]) => {
        const current = dateFilterModelToDays(api.getColumnFilterModel('timestamp'));
        if (current && sameDaySet(current, days)) return;
        applyingFilter.current = true;
        void api
            .setColumnFilterModel('timestamp', buildDateFilterModel(days))
            .then(() => api.onFilterChanged())
            // A rejection here must not leave the guard latched, which would silently
            // stop the grid from ever driving the chart selection again.
            .finally(() => {
                applyingFilter.current = false;
            });
    }, []);

    useImperativeHandle(
        ref,
        () => ({
            clearFilters: () => {
                const api = apiRef.current;
                if (!api) return;
                applyingFilter.current = true;
                api.setFilterModel(null);
                applyingFilter.current = false;
                onFilterDaysChange([]);
                emitFilterModel(api);
            },
        }),
        [onFilterDaysChange, emitFilterModel]
    );

    const onGridReady = useCallback(
        ({ api }: GridReadyEvent<Session>) => {
            apiRef.current = api;
            applyDateFilter(api, selectedDays);
            emitFilterModel(api);
        },
        [applyDateFilter, selectedDays, emitFilterModel]
    );

    useEffect(() => {
        if (apiRef.current) applyDateFilter(apiRef.current, selectedDays);
    }, [applyDateFilter, selectedDays]);

    // On any filter change, mirror the When filter onto the chart selection and
    // re-emit the non-When-filtered sessions that feed the chart.
    const onFilterChanged = useCallback(
        ({ api }: FilterChangedEvent<Session>) => {
            if (applyingFilter.current) return;
            const days = dateFilterModelToDays(api.getColumnFilterModel('timestamp'));
            if (days && !sameDaySet(days, selectedDays)) onFilterDaysChange(days);
            emitFilterModel(api);
        },
        [onFilterDaysChange, selectedDays, emitFilterModel]
    );

    const columnDefs = useMemo<ColDef<Session>[]>(
        () => [
            {
                field: 'timestamp',
                headerName: 'When',
                minWidth: 140,
                sort: 'desc',
                filter: 'agDateColumnFilter',
                filterParams: {
                    // Only the operators the chart selection can round-trip to days.
                    filterOptions: ['equals', 'inRange'],
                    // Allow one OR-condition per selected day; the default cap is 2.
                    maxNumConditions: 60,
                    inRangeInclusive: true,
                },
                // Filter by calendar day (midnight) so day-granular chart selections match.
                filterValueGetter: ({ data }) => (data ? startOfDay(new Date(data.timestamp)) : null),
                valueFormatter: ({ value }) => (value == null ? '' : fmtDateTime(new Date(value))),
            },
            { field: 'channel', headerName: 'Channel', minWidth: 100, filter: 'agSetColumnFilter' },
            { field: 'deviceCategory', headerName: 'Device', minWidth: 100, filter: 'agSetColumnFilter' },
            { field: 'browser', headerName: 'Browser', minWidth: 100, filter: 'agSetColumnFilter' },
            { field: 'country', headerName: 'Country', minWidth: 130, filter: 'agSetColumnFilter' },
            {
                colId: 'visitor',
                headerName: 'Visitor',
                minWidth: 100,
                filter: 'agSetColumnFilter',
                // A string value (not the raw boolean) so the grid shows text
                // instead of its default boolean checkmark rendering.
                valueGetter: ({ data }) => (data?.isNewVisitor ? 'New' : 'Returning'),
            },
            { field: 'landingPage', headerName: 'Landing', minWidth: 110, filter: 'agSetColumnFilter' },
            { field: 'exitPage', headerName: 'Exit', minWidth: 110, filter: 'agSetColumnFilter' },
            {
                field: 'pageviewsCount',
                headerName: 'Page views',
                minWidth: 100,
                filter: 'agNumberColumnFilter',
                filterParams: {
                    filterOptions: ['equals', 'lessThan', 'greaterThan', 'inRange'],
                    inRangeInclusive: true,
                },
            },
            {
                field: 'sessionDuration',
                headerName: 'Duration',
                minWidth: 100,
                filter: 'agNumberColumnFilter',
                filterParams: {
                    filterOptions: ['lessThan', 'greaterThan', 'inRange'],
                    inRangeInclusive: true,
                },
                valueFormatter: ({ value }) => (value == null ? '' : fmtDuration(value)),
            },
            {
                colId: 'converted',
                headerName: 'Converted',
                minWidth: 100,
                filter: 'agSetColumnFilter',
                valueGetter: ({ data }) => (data?.converted ? 'Yes' : 'No'),
            },
            {
                field: 'conversionValue',
                headerName: 'Value',
                minWidth: 100,
                filter: 'agNumberColumnFilter',
                filterParams: {
                    filterOptions: ['lessThan', 'greaterThan', 'inRange'],
                    inRangeInclusive: true,
                },
                valueFormatter: ({ value }) => (value ? fmtCurrency(value) : '—'),
            },
        ],
        []
    );

    return (
        <div className="wa-grid-host">
            <AgGridReact<Session>
                theme={gridTheme}
                rowData={sessions}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onFilterChanged={onFilterChanged}
                rowHeight={36}
                headerHeight={38}
                domLayout="autoHeight"
                pagination
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 20, 50]}
            />
        </div>
    );
});
