import { type Bar } from './data';

/** A market bar decorated with a `Date` for the ordinal-time x axis. */
export interface ChartDatum extends Bar {
    date: Date;
}

/** A live watchlist quote for a single instrument. */
export interface Quote {
    ticker: string;
    name: string;
    last: number;
    change: number;
    changePct: number;
    /** Recent close prices, oldest first — drives the trend sparkline. */
    history: number[];
    /** The session open, fixed for the session — the sparkline's up/down baseline. */
    baseline: number;
}

/** A static market-overview row (trending / most-active tables). */
export interface MoverRow {
    ticker: string;
    name: string;
    last: number;
    changePct: number;
    /** Traded volume in millions of shares. */
    volume: number;
    /** Recent close prices, oldest first — drives the trend sparkline. */
    history: number[];
    /** The session open, fixed for the session — the sparkline's up/down baseline. */
    baseline: number;
}
