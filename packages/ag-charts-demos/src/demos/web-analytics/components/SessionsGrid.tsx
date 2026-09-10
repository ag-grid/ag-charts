import type { ColDef, GridApi, GridReadyEvent, ModelUpdatedEvent, OverlayComponentUserParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';

import { browserIconUrl } from '../browsers';
import { deviceIconUrl } from '../devices';
import { flagUrl } from '../flags';
import { fmtCurrency, fmtDateTime, fmtDuration } from '../format';
import type { Session } from '../types';
import { baseColDef, gridTheme } from './grid';

// The icon is decorative: the name beside it carries the meaning. Buckets with no
// icon ("Unknown" country, "Other" browser) render as text alone.
const iconCell =
    (iconUrl: (value: string) => string | undefined, imgClass = 'wa-cell-icon') =>
    ({ value }: { value?: string }) => {
        if (value == null || value === '') return null;
        const src = iconUrl(value);
        return (
            <span className="wa-icon-cell">
                {src != null && src !== '' && (
                    <img className={imgClass} src={src} alt="" aria-hidden="true" loading="lazy" />
                )}
                {value}
            </span>
        );
    };

const CountryCell = iconCell(flagUrl, 'wa-flag');
const DeviceCell = iconCell(deviceIconUrl);
const BrowserCell = iconCell(browserIconUrl);

// No selection means no rows at all, so the grid shows `noRows`; `noMatchingRows`
// needs rows that the column filters then exclude.
const overlayComponentParams: OverlayComponentUserParams = {
    noRows: { overlayText: 'Click or drag across chart above to display matching sessions.' },
    noMatchingRows: { overlayText: 'No sessions match the current filters. Try adjusting your filters.' },
};

interface SessionsGridProps {
    /**
     * The rows to show: the sessions on the days selected on the traffic chart, already
     * narrowed by the caller. Empty means nothing is selected, which is the grid's
     * starting state and puts the prompt above in place of the rows.
     */
    sessions: Session[];
    /**
     * Called whenever the grid's model settles, with its column filter model (colId →
     * model) and the number of rows those filters leave displayed.
     */
    onGridStateChange: (filterModel: Record<string, unknown>, displayedRowCount: number) => void;
}

export interface SessionsGridHandle {
    /** Clears every column filter. The chart selection is not a filter and is left alone. */
    clearFilters: () => void;
}

// The chart selection supplies row data, not a filter model, so the column filters
// narrow those rows and never feed back to the chart.
export const SessionsGrid = forwardRef<SessionsGridHandle, SessionsGridProps>(function SessionsGrid(
    { sessions, onGridStateChange },
    ref
) {
    const apiRef = useRef<GridApi<Session> | null>(null);
    const defaultColDef = useMemo(() => baseColDef<Session>(), []);

    const emitGridState = useCallback(
        (api: GridApi<Session>) => onGridStateChange(api.getFilterModel(), api.getDisplayedRowCount()),
        [onGridStateChange]
    );

    useImperativeHandle(
        ref,
        () => ({
            // The resulting filter change emits the new state on its own.
            clearFilters: () => apiRef.current?.setFilterModel(null),
        }),
        []
    );

    const onGridReady = useCallback(
        ({ api }: GridReadyEvent<Session>) => {
            apiRef.current = api;
            emitGridState(api);
        },
        [emitGridState]
    );

    // Fires for filter changes and new row data alike, so one handler covers both.
    const onModelUpdated = useCallback(({ api }: ModelUpdatedEvent<Session>) => emitGridState(api), [emitGridState]);

    const columnDefs = useMemo<ColDef<Session>[]>(
        () => [
            {
                field: 'timestamp',
                headerName: 'When',
                minWidth: 140,
                // `initialSort`, not `sort`, so the user's own sorting is not overridden.
                initialSort: 'desc',
                filter: false,
                valueFormatter: ({ value }) => (value == null ? '' : fmtDateTime(new Date(value))),
            },
            { field: 'channel', headerName: 'Channel', minWidth: 100, filter: 'agSetColumnFilter' },
            {
                field: 'deviceCategory',
                headerName: 'Device',
                minWidth: 120,
                filter: 'agSetColumnFilter',
                cellRenderer: DeviceCell,
            },
            {
                field: 'browser',
                headerName: 'Browser',
                minWidth: 120,
                filter: 'agSetColumnFilter',
                cellRenderer: BrowserCell,
            },
            {
                field: 'country',
                headerName: 'Country',
                minWidth: 150,
                filter: 'agSetColumnFilter',
                cellRenderer: CountryCell,
            },
            {
                colId: 'visitor',
                headerName: 'Visitor',
                minWidth: 100,
                filter: 'agSetColumnFilter',
                // A string value, so the grid shows text instead of its default boolean checkmark rendering.
                valueGetter: ({ data }) => (data?.isNewVisitor ? 'New' : 'Returning'),
            },
            { field: 'landingPage', headerName: 'Landing', minWidth: 110, filter: 'agSetColumnFilter' },
            { field: 'exitPage', headerName: 'Exit', minWidth: 110, filter: 'agSetColumnFilter' },
            {
                field: 'pageviewsCount',
                headerName: 'Page views',
                type: 'rightAligned',
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
                type: 'rightAligned',
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
                type: 'rightAligned',
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
                onModelUpdated={onModelUpdated}
                overlayComponentParams={overlayComponentParams}
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
