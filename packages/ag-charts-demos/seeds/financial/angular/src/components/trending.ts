import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { type ColDef } from 'ag-grid-community';

import { fmtPrice } from '../format';
import { type MoverRow } from '../types';
import { formatOrBlank, signedPct, sparklineColDef, tickerColDef, upDownRules } from './grid';
import { TICKER_GRID_TEMPLATE, TickerGrid } from './ticker-grid';

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

@Component({
    selector: 'div[finTrending]',
    imports: [AgGridAngular],
    host: { class: 'fin-section' },
    template: TICKER_GRID_TEMPLATE,
})
export class Trending extends TickerGrid<MoverRow> {
    protected readonly title = 'Trending';
    protected readonly gridClassName = 'fin-trending-grid';
    protected readonly columnDefs = columnDefs;
}
