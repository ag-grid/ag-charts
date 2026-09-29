import {
    type ColDef,
    type GridApi,
    type GridReadyEvent,
    type ICellRendererParams,
    type ModelUpdatedEvent,
    type OverlayComponentUserParams,
    createGrid,
} from 'ag-grid-community';

import { browserIconUrl } from '../browsers';
import { deviceIconUrl } from '../devices';
import { type View, h } from '../dom';
import { flagUrl } from '../flags';
import { fmtCurrency, fmtDateTime, fmtDuration } from '../format';
import type { Session } from '../types';
import { baseColDef, gridTheme } from './grid';

// The icon is decorative: the name beside it carries the meaning. Buckets with no
// icon ("Unknown" country, "Other" browser) render as text alone.
const iconCell =
    (iconUrl: (value: string) => string | undefined, imgClass = 'wa-cell-icon') =>
    ({ value }: ICellRendererParams<Session, string>) => {
        if (!value) return '';
        const src = iconUrl(value);
        return h(
            'span',
            { class: 'wa-icon-cell' },
            src && h('img', { class: imgClass, src, alt: '', 'aria-hidden': 'true', loading: 'lazy' }),
            value
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

export interface SessionsGrid extends View {
    /** Show a new row set, as a `rowData` prop change does. */
    update(sessions: Session[]): void;
    /** Clears every column filter. The chart selection is not a filter and is left alone. */
    clearFilters(): void;
}

const columnDefs: ColDef<Session>[] = [
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
];

// The chart selection supplies row data, not a filter model, so the column filters
// narrow those rows and never feed back to the chart.
export function createSessionsGrid({ sessions, onGridStateChange }: SessionsGridProps): SessionsGrid {
    // `createGrid` inserts its own full-height div into this element and themes that, which is the
    // div ag-grid-react renders, so the host is handed over as is.
    const el = h('div', { class: 'wa-grid-host' });
    let api: GridApi<Session> | undefined;

    const emitGridState = (readyApi: GridApi<Session>) =>
        onGridStateChange(readyApi.getFilterModel(), readyApi.getDisplayedRowCount());

    return {
        el,
        mount() {
            api = createGrid<Session>(el, {
                theme: gridTheme,
                rowData: sessions,
                columnDefs,
                defaultColDef: baseColDef<Session>(),
                onGridReady: ({ api: readyApi }: GridReadyEvent<Session>) => emitGridState(readyApi),
                // Fires for filter changes and new row data alike, so one handler covers both.
                onModelUpdated: ({ api: readyApi }: ModelUpdatedEvent<Session>) => emitGridState(readyApi),
                overlayComponentParams,
                rowHeight: 36,
                headerHeight: 38,
                domLayout: 'autoHeight',
                pagination: true,
                paginationPageSize: 10,
                paginationPageSizeSelector: [10, 20, 50],
            });
        },
        update(next) {
            if (next === sessions) return;
            sessions = next;
            api?.setGridOption('rowData', sessions);
        },
        // The resulting filter change emits the new state on its own.
        clearFilters() {
            api?.setFilterModel(null);
        },
        destroy() {
            api?.destroy();
            api = undefined;
        },
    };
}
