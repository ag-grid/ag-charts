import { type ColDef } from 'ag-grid-community';
import { type CustomCellRendererProps } from 'ag-grid-react';
import { useEffect, useMemo, useRef } from 'react';

import { fmtPrice } from '../format';
import { TickerCell } from './TickerCell';
import { TickerGrid } from './TickerGrid';
import { formatOrBlank, signedPct, sparklineColDef, upDownRules } from './grid';

/** A dealable row: the live quote plus the two-sided price and the session range. */
export interface SavedMarketRow {
    ticker: string;
    name: string;
    changePct: number;
    /** Bid — what the demo account would sell at. */
    sell: number;
    /** Ask — what the demo account would buy at. */
    buy: number;
    low: number;
    high: number;
    /** Recent close prices, oldest first — drives the trend sparkline. */
    history: number[];
    /** The session open, fixed for the session — the sparkline's up/down baseline. */
    baseline: number;
}

// Half-spread as a fraction of price. A real venue quotes per-instrument spreads;
// one flat figure is enough to make the two-sided price read correctly.
const HALF_SPREAD = 0.0002;

// How long a ticked price stays lit before fading back to ink.
const FLASH_MS = 500;

// The subset of Quote/MoverRow that a dealable row is derived from, so a watchlist
// quote and a market-overview mover can both feed the table.
interface QuoteLike {
    ticker: string;
    name: string;
    last: number;
    changePct: number;
    history: number[];
    baseline: number;
}

function toDealableRow({ ticker, name, last, changePct, history, baseline }: QuoteLike): SavedMarketRow {
    const half = last * HALF_SPREAD;
    const sell = last - half;
    const buy = last + half;
    // The visible trend window is the only price range the demo actually holds, so the
    // range columns are derived from it rather than implying a full session's extremes.
    // The dealable prices are folded in so the range always brackets them — the latest
    // close can otherwise sit outside its own history.
    const range = [...history, sell, buy];
    return {
        ticker,
        name,
        changePct,
        sell,
        buy,
        low: Math.min(...range),
        high: Math.max(...range),
        history,
        baseline,
    };
}

/**
 * A price that lights green or red on the tick that moved it, then fades back. The
 * colour lands on the figure alone — flashing the whole cell would strobe a band of
 * background across the row on every tick.
 */
function PriceCell({ value }: CustomCellRendererProps<SavedMarketRow, number>) {
    const ref = useRef<HTMLSpanElement>(null);
    const previous = useRef<number | null>(null);

    useEffect(() => {
        const node = ref.current;
        const prior = previous.current;
        previous.current = value ?? null;
        if (!node || value == null || prior == null || value === prior) return;
        const direction = value > prior ? 'fin-tick-up' : 'fin-tick-down';
        node.classList.remove('fin-tick-up', 'fin-tick-down');
        // Reading offsetWidth forces a reflow, so re-adding the class restarts the flash
        // rather than being coalesced away when a price ticks the same way twice.
        void node.offsetWidth;
        node.classList.add(direction);
        const id = window.setTimeout(() => node.classList.remove(direction), FLASH_MS);
        return () => window.clearTimeout(id);
    }, [value]);

    return (
        <span ref={ref} className="fin-price">
            {value == null ? '' : fmtPrice(value)}
        </span>
    );
}

// Module scope so each renderer keeps a stable identity: a fresh function per render
// would make AG Grid tear the cell down and rebuild it on every tick.
const SellButton = () => (
    <button type="button" className="fin-deal-btn" data-side="sell">
        Sell
    </button>
);
const BuyButton = () => (
    <button type="button" className="fin-deal-btn" data-side="buy">
        Buy
    </button>
);

const upDown = upDownRules<SavedMarketRow>();
const price = formatOrBlank<SavedMarketRow>(fmtPrice);

const columnDefs: ColDef<SavedMarketRow>[] = [
    { field: 'name', headerName: 'Market', flex: 2.4, minWidth: 140, tooltipField: 'ticker', cellRenderer: TickerCell },
    {
        field: 'changePct',
        headerName: 'Change',
        type: 'rightAligned',
        valueFormatter: formatOrBlank<SavedMarketRow>(signedPct),
        cellClassRules: upDown,
    },
    sparklineColDef<SavedMarketRow>(),
    { field: 'sell', headerName: 'Sell', type: 'rightAligned', cellRenderer: PriceCell },
    { colId: 'sellAction', headerName: '', flex: 0.7, minWidth: 52, sortable: false, cellRenderer: SellButton },
    { field: 'buy', headerName: 'Buy', type: 'rightAligned', cellRenderer: PriceCell },
    { colId: 'buyAction', headerName: '', flex: 0.7, minWidth: 52, sortable: false, cellRenderer: BuyButton },
    { field: 'low', headerName: 'Low', type: 'rightAligned', valueFormatter: price },
    { field: 'high', headerName: 'High', type: 'rightAligned', valueFormatter: price },
];

interface SavedMarketsProps {
    /** Every saved market, in display order. Duplicated tickers are dropped. */
    sources: QuoteLike[];
    activeTicker: string;
    onSelect: (ticker: string) => void;
}

/**
 * The saved-markets table: a dealing-style board of every saved instrument, taking
 * the place of the gauges and peer charts while it is open.
 */
export function SavedMarkets({ sources, activeTicker, onSelect }: SavedMarketsProps) {
    const rows = useMemo(() => {
        // getRowId keys on ticker, so a duplicate would collide in the grid.
        const byTicker = new Map<string, SavedMarketRow>();
        for (const source of sources) {
            if (!byTicker.has(source.ticker)) byTicker.set(source.ticker, toDealableRow(source));
        }
        return [...byTicker.values()];
    }, [sources]);

    return (
        <TickerGrid
            title="Saved markets"
            gridClassName="fin-saved-grid"
            columnDefs={columnDefs}
            rowData={rows}
            activeTicker={activeTicker}
            onSelect={onSelect}
        />
    );
}
