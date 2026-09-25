import { type ColDef } from 'ag-grid-community';

import { fmtPrice } from '../format';
import { type MoverRow } from '../types';
import { type TickerGrid, createTickerGrid } from './TickerGrid';
import { formatOrBlank, signedPct, sparklineColDef, tickerColDef, upDownRules } from './grid';

const upDown = upDownRules<MoverRow>();

// "Trending" = the biggest movers, ranked by absolute % change; values stream live.
const columnDefs: ColDef<MoverRow>[] = [
    tickerColDef<MoverRow>('ticker', 'name'),
    { field: 'last', headerName: 'Last', type: 'rightAligned', valueFormatter: formatOrBlank<MoverRow>(fmtPrice) },
    {
        field: 'changePct',
        headerName: '% Chg',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<MoverRow>(signedPct),
        cellClassRules: upDown,
    },
    sparklineColDef<MoverRow>(),
];

interface TrendingProps {
    rows: MoverRow[];
    activeTicker: string;
    onSelect: (ticker: string) => void;
}

export function createTrending({ rows, activeTicker, onSelect }: TrendingProps): TickerGrid<MoverRow> {
    return createTickerGrid({
        title: 'Trending',
        gridClassName: 'fin-trending-grid',
        columnDefs,
        rowData: rows,
        activeTicker,
        onSelect,
    });
}
