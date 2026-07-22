import { type ColDef } from 'ag-grid-community';

import { fmtPrice } from '../format';
import { type Quote } from '../types';
import { TickerGrid } from './TickerGrid';
import { formatOrBlank, signed, signedPct, sparklineColDef, upDownRules } from './grid';

const upDown = upDownRules<Quote>();

const columnDefs: ColDef<Quote>[] = [
    { field: 'ticker', headerName: 'Ticker', flex: 0.9, tooltipField: 'name' },
    { field: 'last', headerName: 'Last', type: 'rightAligned', valueFormatter: formatOrBlank<Quote>(fmtPrice) },
    {
        field: 'change',
        headerName: 'Chg',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<Quote>(signed),
        cellClassRules: upDown,
    },
    {
        field: 'changePct',
        headerName: '% Chg',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<Quote>(signedPct),
        cellClassRules: upDown,
    },
    sparklineColDef<Quote>(),
];

interface WatchlistProps {
    quotes: Quote[];
    activeTicker: string;
    onSelect: (ticker: string) => void;
}

export function Watchlist({ quotes, activeTicker, onSelect }: WatchlistProps) {
    return (
        <TickerGrid
            title="Watchlist"
            gridClassName="fin-watchlist-grid"
            columnDefs={columnDefs}
            rowData={quotes}
            activeTicker={activeTicker}
            onSelect={onSelect}
        />
    );
}
