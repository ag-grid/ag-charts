import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useMemo } from 'react';

import { fmtDuration, fmtInt, fmtPct } from '../format';
import type { PageRow } from '../types';
import { baseColDef, gridTheme } from './grid';

const rate = ({ value }: ValueFormatterParams<PageRow, number>) => (value == null ? '' : fmtPct(value));

interface PageGridProps {
    rows: PageRow[];
}

export function PageGrid({ rows }: PageGridProps) {
    // This grid is read-only: sorting is enough to surface top and bottom pages, and
    // nothing downstream reacts to its filter state (unlike the sessions grid).
    const defaultColDef = useMemo(() => ({ ...baseColDef<PageRow>(), filter: false }), []);
    const columnDefs = useMemo<ColDef<PageRow>[]>(
        () => [
            { field: 'pagePath', headerName: 'Page', flex: 1.4, minWidth: 150 },
            { field: 'pageTitle', headerName: 'Title', flex: 1.2, minWidth: 140 },
            {
                field: 'pageviews',
                headerName: 'Pageviews',
                valueFormatter: ({ value }) => (value == null ? '' : fmtInt(value)),
                sort: 'desc',
            },
            {
                field: 'uniquePageviews',
                headerName: 'Unique',
                valueFormatter: ({ value }) => (value == null ? '' : fmtInt(value)),
            },
            {
                field: 'avgTimeOnPage',
                headerName: 'Avg time',
                valueFormatter: ({ value }) => (value == null ? '' : fmtDuration(value)),
            },
            {
                field: 'entrances',
                headerName: 'Entrances',
                valueFormatter: ({ value }) => (value == null ? '' : fmtInt(value)),
            },
            { field: 'bounceRate', headerName: 'Bounce', valueFormatter: rate },
            { field: 'exitRate', headerName: 'Exit', valueFormatter: rate },
            { field: 'conversionRate', headerName: 'Conv. rate', valueFormatter: rate },
        ],
        []
    );

    return (
        <div className="wa-grid-host">
            <AgGridReact<PageRow>
                theme={gridTheme}
                rowData={rows}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowHeight={40}
                headerHeight={40}
                domLayout="autoHeight"
            />
        </div>
    );
}
