import { type ColDef, type RowClassRules } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useRef } from 'react';

import { baseColDef, getRowId, gridTheme } from './grid';

interface TickerGridProps<T extends { ticker: string }> {
    title: string;
    gridClassName: string;
    columnDefs: ColDef<T>[];
    rowData: T[];
    activeTicker: string;
    onSelect: (ticker: string) => void;
}

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

    // rowClassRules close over activeTicker; redraw so the highlight follows a
    // selection made elsewhere.
    const rowClassRules = useMemo<RowClassRules<T>>(
        () => ({ 'fin-grid-active': ({ data }) => data?.ticker === activeTicker }),
        [activeTicker]
    );
    useEffect(() => {
        gridRef.current?.api?.redrawRows();
    }, [activeTicker]);

    return (
        <div className="fin-section">
            <h3 className="fin-section-title">{title}</h3>
            <div className={gridClassName}>
                <AgGridReact<T>
                    ref={gridRef}
                    theme={gridTheme}
                    rowData={rowData}
                    getRowId={getRowId}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    rowClassRules={rowClassRules}
                    rowHeight={28}
                    headerHeight={30}
                    suppressCellFocus
                    onRowClicked={({ data }) => data && onSelect(data.ticker)}
                />
            </div>
        </div>
    );
}
