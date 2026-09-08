import {
    type CellKeyDownEvent,
    type ColDef,
    type FirstDataRenderedEvent,
    type FullWidthCellKeyDownEvent,
    type GridApi,
    type RowSelectionOptions,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { baseColDef, getRowId, gridTheme, rowValuesEqual } from './grid';

interface TickerGridProps<T extends { ticker: string }> {
    title: string;
    gridClassName: string;
    columnDefs: ColDef<T>[];
    rowData: T[];
    activeTicker: string;
    onSelect: (ticker: string) => void;
}

// Selection carries the active highlight, so moving it must never tear down a row's cell renderers.
const rowSelection: RowSelectionOptions = { mode: 'singleRow', checkboxes: false };

// A titled watchlist-style grid: a fixed row set whose values stream in place,
// with the active ticker highlighted and rows selectable.
export function TickerGrid<T extends { ticker: string }>({
    title,
    gridClassName,
    columnDefs,
    rowData,
    activeTicker,
    onSelect,
}: TickerGridProps<T>) {
    const gridRef = useRef<AgGridReact<T>>(null);
    const defaultColDef = useMemo(() => baseColDef<T>(), []);

    // OPTIMIZATION: the row set never changes shape, so seed once and stream only the changed rows
    // as transactions — the grid refreshes those cells in place instead of diffing a fresh array.
    const initialRowData = useRef(rowData);
    const seenRows = useRef(new Map<string, T>(rowData.map((row) => [row.ticker, row])));
    useEffect(() => {
        const api = gridRef.current?.api;
        if (!api) return;
        const seen = seenRows.current;
        const update: T[] = [];
        for (const row of rowData) {
            const previous = seen.get(row.ticker);
            if (!previous || !rowValuesEqual(previous, row)) update.push(row);
            seen.set(row.ticker, row);
        }
        if (update.length > 0) api.applyTransactionAsync({ update });
    }, [rowData]);

    // `gridRef` holds no API until the grid signals ready, a render after mount, so the first sync
    // takes the one the grid hands it.
    const syncSelection = useCallback(
        (readyApi?: GridApi<T>) => {
            const api = readyApi ?? gridRef.current?.api;
            if (!api) return;
            const node = api.getRowNode(activeTicker);
            // A ticker belongs to one list, so the lists without it clear theirs and one row stays selected.
            if (node) api.setNodesSelected({ nodes: [node], newValue: true });
            else api.deselectAll();
        },
        [activeTicker]
    );
    useEffect(() => {
        syncSelection();
    }, [syncSelection]);
    const onFirstDataRendered = ({ api }: FirstDataRenderedEvent<T>) => syncSelection(api);

    const onCellKeyDown = ({ event, data }: CellKeyDownEvent<T> | FullWidthCellKeyDownEvent<T>) => {
        if (!data || !(event instanceof KeyboardEvent)) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(data.ticker);
        }
    };

    return (
        <div className="fin-section">
            <h3 className="fin-section-title">{title}</h3>
            <div className={gridClassName}>
                <AgGridReact<T>
                    ref={gridRef}
                    theme={gridTheme}
                    rowData={initialRowData.current}
                    getRowId={getRowId}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowSelection={rowSelection}
                    onFirstDataRendered={onFirstDataRendered}
                    domLayout="autoHeight"
                    rowHeight={28}
                    headerHeight={30}
                    onRowClicked={({ data }) => data && onSelect(data.ticker)}
                    onCellKeyDown={onCellKeyDown}
                />
            </div>
        </div>
    );
}
