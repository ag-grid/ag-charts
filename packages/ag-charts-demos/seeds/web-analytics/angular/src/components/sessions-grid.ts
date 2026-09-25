import { Component, input, output, viewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridReadyEvent, ModelUpdatedEvent, OverlayComponentUserParams } from 'ag-grid-community';

import { browserIconUrl } from '../browsers';
import { deviceIconUrl } from '../devices';
import { flagUrl } from '../flags';
import { fmtCurrency, fmtDateTime, fmtDuration } from '../format';
import type { Session } from '../types';
import { baseColDef, gridTheme } from './grid';
import { IconCell, type IconCellParams } from './icon-cell';

// The React `iconCell(flagUrl, 'wa-flag')` etc.: the same renderer, told which icon set to use.
const iconCell = (
    iconUrl: IconCellParams['iconUrl'],
    imgClass?: string
): Pick<ColDef, 'cellRenderer' | 'cellRendererParams'> => ({
    cellRenderer: IconCell,
    cellRendererParams: { iconUrl, imgClass } satisfies IconCellParams,
});

// No selection means no rows at all, so the grid shows `noRows`; `noMatchingRows`
// needs rows that the column filters then exclude.
const overlayComponentParams: OverlayComponentUserParams = {
    noRows: { overlayText: 'Click or drag across chart above to display matching sessions.' },
    noMatchingRows: { overlayText: 'No sessions match the current filters. Try adjusting your filters.' },
};

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
        ...iconCell(deviceIconUrl),
    },
    {
        field: 'browser',
        headerName: 'Browser',
        minWidth: 120,
        filter: 'agSetColumnFilter',
        ...iconCell(browserIconUrl),
    },
    {
        field: 'country',
        headerName: 'Country',
        minWidth: 150,
        filter: 'agSetColumnFilter',
        ...iconCell(flagUrl, 'wa-flag'),
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

/** What the grid reports whenever its model settles: the React `onGridStateChange` arguments. */
export interface GridState {
    /** The column filter model (colId → model). */
    filterModel: Record<string, unknown>;
    /** The number of rows those filters leave displayed. */
    displayedRowCount: number;
}

/**
 * The sessions grid, inside its `.wa-grid-host` host. The chart selection supplies row data, not a
 * filter model, so the column filters narrow those rows and never feed back to the chart.
 */
@Component({
    selector: 'div[waSessionsGrid]',
    imports: [AgGridAngular],
    host: { class: 'wa-grid-host' },
    template: `
        <ag-grid-angular
            style="display: block; height: 100%"
            [theme]="gridTheme"
            [rowData]="sessions()"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            (gridReady)="onGridReady($event)"
            (modelUpdated)="onModelUpdated($event)"
            [overlayComponentParams]="overlayComponentParams"
            [rowHeight]="36"
            [headerHeight]="38"
            domLayout="autoHeight"
            [pagination]="true"
            [paginationPageSize]="10"
            [paginationPageSizeSelector]="pageSizes"
        />
    `,
})
export class SessionsGrid {
    /**
     * The rows to show: the sessions on the days selected on the traffic chart, already
     * narrowed by the caller. Empty means nothing is selected, which is the grid's
     * starting state and puts the prompt above in place of the rows.
     */
    readonly sessions = input.required<Session[]>();
    /** Emitted whenever the grid's model settles. */
    readonly gridStateChange = output<GridState>();

    protected readonly gridTheme = gridTheme;
    protected readonly columnDefs = columnDefs;
    protected readonly defaultColDef = baseColDef<Session>();
    protected readonly overlayComponentParams = overlayComponentParams;
    protected readonly pageSizes = [10, 20, 50];

    private readonly grid = viewChild.required(AgGridAngular<Session>);

    /** Clears every column filter. The chart selection is not a filter and is left alone. */
    clearFilters(): void {
        // The resulting filter change emits the new state on its own.
        this.grid().api?.setFilterModel(null);
    }

    protected onGridReady({ api }: GridReadyEvent<Session>): void {
        this.emitGridState(api);
    }

    // Fires for filter changes and new row data alike, so one handler covers both.
    protected onModelUpdated({ api }: ModelUpdatedEvent<Session>): void {
        this.emitGridState(api);
    }

    private emitGridState(api: GridApi<Session>): void {
        this.gridStateChange.emit({ filterModel: api.getFilterModel(), displayedRowCount: api.getDisplayedRowCount() });
    }
}
