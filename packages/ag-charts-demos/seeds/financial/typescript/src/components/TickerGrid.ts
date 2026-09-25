import {
    type CellKeyDownEvent,
    type ColDef,
    type FirstDataRenderedEvent,
    type FullWidthCellKeyDownEvent,
    type GridApi,
    type RowSelectionOptions,
    createGrid,
} from 'ag-grid-community';

import { type View, h } from '../dom';
import { baseColDef, getRowId, gridTheme, rowValuesEqual } from './grid';

interface TickerGridProps<T extends { ticker: string }> {
    title: string;
    gridClassName: string;
    columnDefs: ColDef<T>[];
    rowData: T[];
    activeTicker: string;
    onSelect: (ticker: string) => void;
}

export interface TickerGrid<T> extends View {
    update(props: { rowData: T[]; activeTicker: string }): void;
}

// Selection carries the active highlight, so moving it must never tear down a row's cell renderers.
const rowSelection: RowSelectionOptions = { mode: 'singleRow', checkboxes: false };

// A titled watchlist-style grid: a fixed row set whose values stream in place,
// with the active ticker highlighted and rows selectable.
export function createTickerGrid<T extends { ticker: string }>({
    title,
    gridClassName,
    columnDefs,
    rowData,
    activeTicker,
    onSelect,
}: TickerGridProps<T>): TickerGrid<T> {
    // `createGrid` inserts its own full-height div into this element and themes that, which is the
    // div ag-grid-react renders, so the class-named element is handed over as is.
    const gridDiv = h('div', { class: gridClassName });
    const el = h('div', { class: 'fin-section' }, h('h3', { class: 'fin-section-title' }, title), gridDiv);

    let api: GridApi<T> | undefined;
    // OPTIMIZATION: the row set never changes shape, so seed once and stream only the changed rows
    // as transactions — the grid refreshes those cells in place instead of diffing a fresh array.
    const seen = new Map<string, T>(rowData.map((row) => [row.ticker, row]));

    // The API arrives when the grid is created, but rows exist only once it signals ready, so the
    // first sync takes the one the grid hands it.
    const syncSelection = (readyApi: GridApi<T> | undefined = api) => {
        if (!readyApi) return;
        const node = readyApi.getRowNode(activeTicker);
        // A ticker belongs to one list, so the lists without it clear theirs and one row stays selected.
        if (node) readyApi.setNodesSelected({ nodes: [node], newValue: true });
        else readyApi.deselectAll();
    };

    const onCellKeyDown = ({ event, data }: CellKeyDownEvent<T> | FullWidthCellKeyDownEvent<T>) => {
        if (!data || !(event instanceof KeyboardEvent)) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(data.ticker);
        }
    };

    return {
        el,
        mount() {
            api = createGrid<T>(gridDiv, {
                theme: gridTheme,
                rowData,
                getRowId,
                columnDefs,
                defaultColDef: baseColDef<T>(),
                rowSelection,
                onFirstDataRendered: ({ api: readyApi }: FirstDataRenderedEvent<T>) => syncSelection(readyApi),
                domLayout: 'autoHeight',
                rowHeight: 28,
                headerHeight: 30,
                onRowClicked: ({ data }) => data && onSelect(data.ticker),
                onCellKeyDown,
            });
        },
        update(next) {
            if (api && next.rowData !== rowData) {
                const update: T[] = [];
                for (const row of next.rowData) {
                    const previous = seen.get(row.ticker);
                    if (!previous || !rowValuesEqual(previous, row)) update.push(row);
                    seen.set(row.ticker, row);
                }
                if (update.length > 0) api.applyTransactionAsync({ update });
            }
            rowData = next.rowData;
            if (next.activeTicker !== activeTicker) {
                activeTicker = next.activeTicker;
                syncSelection();
            }
        },
        destroy() {
            api?.destroy();
            api = undefined;
        },
    };
}
