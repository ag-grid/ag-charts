import {
    type CellKeyDownEvent,
    type ColDef,
    type FullWidthCellKeyDownEvent,
    type RowClassRules,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useRef } from 'react';

import { baseColDef, getRowId, gridTheme, rowValuesEqual } from './grid';

interface TickerGridProps<T extends { ticker: string }> {
    title: string;
    gridClassName: string;
    columnDefs: ColDef<T>[];
    rowData: T[];
    activeTicker: string;
    onSelect: (ticker: string) => void;
    /**
     * Fill the available height and scroll internally, inside a card, rather than growing
     * to fit every row. Sidebar lists want the latter — they stack, and the sidebar is the
     * thing that scrolls — but a full-width board with every instrument in it would
     * otherwise run off the bottom of the page.
     */
    fillHeight?: boolean;
    /**
     * Column to hold a live sort on, flipping between ascending and descending on an
     * interval. The rows reorder under a streaming feed, which is the point — it shows
     * the sort indicator and the row animation doing real work.
     */
    autoSortColId?: string;
}

// How long each direction holds before the auto-sort flips.
const AUTO_SORT_MS = 4_000;

// A titled watchlist-style grid: a fixed row set whose values stream in place,
// with the active ticker highlighted and rows selectable.
export function TickerGrid<T extends { ticker: string }>({
    title,
    gridClassName,
    columnDefs,
    rowData,
    activeTicker,
    onSelect,
    fillHeight = false,
    autoSortColId,
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

    // rowClassRules close over activeTicker; redraw so the highlight follows a
    // selection made elsewhere.
    const rowClassRules = useMemo<RowClassRules<T>>(
        () => ({ 'fin-grid-active': ({ data }) => data?.ticker === activeTicker }),
        [activeTicker]
    );
    useEffect(() => {
        gridRef.current?.api?.redrawRows();
    }, [activeTicker]);

    // Hold a sort on one column and flip its direction on an interval. Seeded descending,
    // which is the order the mover feeds are already in, so the first flip is the visible one.
    useEffect(() => {
        if (!autoSortColId) return;
        let sort: 'asc' | 'desc' = 'desc';
        const apply = () => gridRef.current?.api?.applyColumnState({ state: [{ colId: autoSortColId, sort }] });
        apply();
        const id = window.setInterval(() => {
            sort = sort === 'desc' ? 'asc' : 'desc';
            apply();
        }, AUTO_SORT_MS);
        return () => window.clearInterval(id);
    }, [autoSortColId]);

    const onCellKeyDown = ({ event, data }: CellKeyDownEvent<T> | FullWidthCellKeyDownEvent<T>) => {
        if (!data || !(event instanceof KeyboardEvent)) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(data.ticker);
        }
    };

    return (
        <div className={fillHeight ? 'fin-section fin-section--fill' : 'fin-section'}>
            <h3 className="fin-section-title">{title}</h3>
            <div className={fillHeight ? `fin-detail-card fin-section-body ${gridClassName}` : gridClassName}>
                <AgGridReact<T>
                    ref={gridRef}
                    theme={gridTheme}
                    rowData={initialRowData.current}
                    getRowId={getRowId}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowClassRules={rowClassRules}
                    // Omitted when filling: the default layout takes its height from the
                    // container and virtualises rows, which autoHeight cannot do.
                    domLayout={fillHeight ? undefined : 'autoHeight'}
                    rowHeight={28}
                    headerHeight={30}
                    onRowClicked={({ data }) => data && onSelect(data.ticker)}
                    onCellKeyDown={onCellKeyDown}
                />
            </div>
        </div>
    );
}
