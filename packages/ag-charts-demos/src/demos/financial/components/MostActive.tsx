import { type ColDef } from 'ag-grid-community';

import { fmtPrice } from '../format';
import { type MoverRow } from '../types';
import { TickerCell } from './TickerCell';
import { TickerGrid } from './TickerGrid';
import { formatOrBlank, signedPct, sparklineColDef, upDownRules } from './grid';

const upDown = upDownRules<MoverRow>();

// "Most active" = the highest-volume names, ranked by traded volume; values stream live.
const columnDefs: ColDef<MoverRow>[] = [
    { field: 'ticker', headerName: 'Ticker', flex: 1.35, minWidth: 74, tooltipField: 'name', cellRenderer: TickerCell },
    { field: 'last', headerName: 'Last', type: 'rightAligned', valueFormatter: formatOrBlank<MoverRow>(fmtPrice) },
    {
        field: 'changePct',
        headerName: '% Chg',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<MoverRow>(signedPct),
        cellClassRules: upDown,
    },
    {
        field: 'volume',
        headerName: 'Vol',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<MoverRow>((value) => `${value.toFixed(1)}M`),
    },
    sparklineColDef<MoverRow>(),
];

interface MostActiveProps {
    rows: MoverRow[];
    activeTicker: string;
    onSelect: (ticker: string) => void;
}

export function MostActive({ rows, activeTicker, onSelect }: MostActiveProps) {
    return (
        <TickerGrid
            title="Most active"
            gridClassName="fin-trending-grid"
            columnDefs={columnDefs}
            rowData={rows}
            activeTicker={activeTicker}
            onSelect={onSelect}
        />
    );
}
