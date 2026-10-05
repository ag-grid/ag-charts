import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { type ColDef } from 'ag-grid-community';

import { fmtPrice } from '../format';
import { type Quote } from '../types';
import { formatOrBlank, signed, signedPct, sparklineColDef, tickerColDef, upDownRules } from './grid';
import { TICKER_GRID_TEMPLATE, TickerGrid } from './ticker-grid';

const upDown = upDownRules<Quote>();

const columnDefs: ColDef<Quote>[] = [
    tickerColDef<Quote>('ticker', 'name'),
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

@Component({
    selector: 'div[finWatchlist]',
    imports: [AgGridAngular],
    host: { class: 'fin-section' },
    template: TICKER_GRID_TEMPLATE,
})
export class Watchlist extends TickerGrid<Quote> {
    protected readonly title = 'Watchlist';
    protected readonly gridClassName = 'fin-watchlist-grid';
    protected readonly columnDefs = columnDefs;
}
