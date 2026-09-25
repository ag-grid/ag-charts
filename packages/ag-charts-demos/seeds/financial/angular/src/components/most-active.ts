import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { type ColDef } from 'ag-grid-community';

import { fmtPrice } from '../format';
import { type MoverRow } from '../types';
import { formatOrBlank, signedPct, sparklineColDef, tickerColDef, upDownRules } from './grid';
import { TICKER_GRID_TEMPLATE, TickerGrid } from './ticker-grid';

const upDown = upDownRules<MoverRow>();

// "Most active" = the highest-volume names, ranked by traded volume; values stream live.
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
    {
        field: 'volume',
        headerName: 'Vol',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<MoverRow>((value) => `${value.toFixed(1)}M`),
    },
    sparklineColDef<MoverRow>(),
];

@Component({
    selector: 'div[finMostActive]',
    imports: [AgGridAngular],
    host: { class: 'fin-section' },
    template: TICKER_GRID_TEMPLATE,
})
export class MostActive extends TickerGrid<MoverRow> {
    protected readonly title = 'Most active';
    protected readonly gridClassName = 'fin-trending-grid';
    protected readonly columnDefs = columnDefs;
}
