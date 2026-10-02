import { Directive, type OnInit, effect, input, output, untracked, viewChild } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
    type CellKeyDownEvent,
    type ColDef,
    type FullWidthCellKeyDownEvent,
    type GridApi,
    type RowClickedEvent,
    type RowSelectionOptions,
} from 'ag-grid-community';

import { baseColDef, getRowId, gridTheme, rowValuesEqual } from './grid';

// Selection carries the active highlight, so moving it must never tear down a row's cell renderers.
const ROW_SELECTION: RowSelectionOptions = { mode: 'singleRow', checkboxes: false };

/**
 * The template every ticker grid renders, inside a `div.fin-section` host. Watchlist, Trending and
 * MostActive are components extending `TickerGrid` with this template, which keeps the React
 * `<TickerGrid title=... />` composition without a second host element around the grid.
 */
export const TICKER_GRID_TEMPLATE = `
    <h3 class="fin-section-title">{{ title }}</h3>
    <div [class]="gridClassName">
        <ag-grid-angular
            style="display: block; height: 100%"
            [theme]="gridTheme"
            [rowData]="initialRowData"
            [getRowId]="getRowId"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef"
            [rowSelection]="rowSelection"
            (firstDataRendered)="syncSelection($event.api)"
            domLayout="autoHeight"
            [rowHeight]="28"
            [headerHeight]="30"
            (rowClicked)="onRowClicked($event)"
            (cellKeyDown)="onCellKeyDown($event)"
        />
    </div>
`;

// A titled watchlist-style grid: a fixed row set whose values stream in place,
// with the active ticker highlighted and rows selectable.
@Directive()
export abstract class TickerGrid<T extends { ticker: string }> implements OnInit {
    protected abstract readonly title: string;
    protected abstract readonly gridClassName: string;
    protected abstract readonly columnDefs: ColDef<T>[];

    readonly rowData = input.required<T[]>();
    readonly activeTicker = input.required<string>();
    readonly select = output<string>();

    protected readonly gridTheme = gridTheme;
    protected readonly getRowId = getRowId;
    protected readonly rowSelection = ROW_SELECTION;
    protected readonly defaultColDef = baseColDef<T>();

    private readonly grid = viewChild(AgGridAngular);
    // OPTIMIZATION: the row set never changes shape, so seed once and stream only the changed rows
    // as transactions — the grid refreshes those cells in place instead of diffing a fresh array.
    protected initialRowData: T[] = [];
    private seenRows = new Map<string, T>();

    constructor() {
        effect(() => {
            const rowData = this.rowData();
            const api = untracked(this.grid)?.api;
            if (!api) return;
            const update: T[] = [];
            for (const row of rowData) {
                const previous = this.seenRows.get(row.ticker);
                if (!previous || !rowValuesEqual(previous, row)) update.push(row);
                this.seenRows.set(row.ticker, row);
            }
            if (update.length > 0) api.applyTransactionAsync({ update });
        });
        effect(() => this.syncSelection());
    }

    ngOnInit(): void {
        this.initialRowData = this.rowData();
        this.seenRows = new Map(this.initialRowData.map((row) => [row.ticker, row]));
    }

    // The grid has no API until it signals ready, after the first render, so the first sync
    // takes the one the grid hands it.
    protected syncSelection(readyApi?: GridApi<T>): void {
        const activeTicker = this.activeTicker();
        const api = readyApi ?? untracked(this.grid)?.api;
        if (!api) return;
        const node = api.getRowNode(activeTicker);
        // A ticker belongs to one list, so the lists without it clear theirs and one row stays selected.
        if (node) api.setNodesSelected({ nodes: [node], newValue: true });
        else api.deselectAll();
    }

    protected onRowClicked({ data }: RowClickedEvent<T>): void {
        if (data) this.select.emit(data.ticker);
    }

    protected onCellKeyDown({ event, data }: CellKeyDownEvent<T> | FullWidthCellKeyDownEvent<T>): void {
        if (!data || !(event instanceof KeyboardEvent)) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.select.emit(data.ticker);
        }
    }
}
