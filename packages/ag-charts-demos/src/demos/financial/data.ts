// Mock market-data engine for the Financial trading-terminal demo.
//
// Everything here is synthetic: a seeded-ish random walk produces OHLC bars and
// volume for a handful of instruments, and `MarketFeed` advances them over time
// so the terminal can render live, streaming charts without a backend.
import { type MoverRow } from './types';

export interface Bar {
    /** Bar timestamp (epoch ms) — used as the x value on an ordinal-time axis. */
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Instrument {
    ticker: string;
    name: string;
    /** Notional starting price for the synthetic series. */
    seed: number;
    /** Per-tick volatility as a fraction of price. */
    volatility: number;
    /** Sector used to group peers for the profile comparison chart. */
    sector: string;
    /** Share of recent headlines that are positive, 0–100 (drives the sentiment gauge). */
    sentiment: number;
    /** Beta relative to the S&P 500 (1 = moves with the market). */
    beta: number;
    /** Aggregated analyst consensus, 0–100 (0 = strong sell, 100 = strong buy). */
    analystRating: number;
}

export const INSTRUMENTS: Instrument[] = [
    {
        ticker: 'ACME',
        name: 'Acme Robotics',
        seed: 187.4,
        volatility: 0.0016,
        sector: 'Technology',
        sentiment: 62,
        beta: 1.15,
        analystRating: 68,
    },
    {
        ticker: 'NOVA',
        name: 'Nova Semiconductors',
        seed: 642.1,
        volatility: 0.0024,
        sector: 'Technology',
        sentiment: 71,
        beta: 1.45,
        analystRating: 82,
    },
    {
        ticker: 'ORBT',
        name: 'Orbital Logistics',
        seed: 74.85,
        volatility: 0.0012,
        sector: 'Energy & Utilities',
        sentiment: 48,
        beta: 0.85,
        analystRating: 45,
    },
    {
        ticker: 'HELX',
        name: 'Helix Biotech',
        seed: 313.6,
        volatility: 0.0031,
        sector: 'Healthcare & Consumer',
        sentiment: 55,
        beta: 1.55,
        analystRating: 58,
    },
    {
        ticker: 'VOLT',
        name: 'Voltaic Energy',
        seed: 96.2,
        volatility: 0.0028,
        sector: 'Energy & Utilities',
        sentiment: 66,
        beta: 1.3,
        analystRating: 72,
    },
    {
        ticker: 'AERO',
        name: 'Aerostar Dynamics',
        seed: 428.9,
        volatility: 0.002,
        sector: 'Technology',
        sentiment: 58,
        beta: 1.1,
        analystRating: 63,
    },
    {
        ticker: 'GRID',
        name: 'Gridline Utilities',
        seed: 58.3,
        volatility: 0.0009,
        sector: 'Energy & Utilities',
        sentiment: 44,
        beta: 0.55,
        analystRating: 38,
    },
    {
        ticker: 'QNTM',
        name: 'Quantum Compute',
        seed: 771.5,
        volatility: 0.0038,
        sector: 'Technology',
        sentiment: 74,
        beta: 1.75,
        analystRating: 88,
    },
    {
        ticker: 'MRSH',
        name: 'Marsh Agriculture',
        seed: 142.7,
        volatility: 0.0014,
        sector: 'Healthcare & Consumer',
        sentiment: 51,
        beta: 0.75,
        analystRating: 52,
    },
    {
        ticker: 'CDGE',
        name: 'Cindergate Foundry',
        seed: 205.1,
        volatility: 0.0022,
        sector: 'Healthcare & Consumer',
        sentiment: 39,
        beta: 1.05,
        analystRating: 30,
    },
];

// Number of points shown in a trend sparkline.
const SPARK_POINTS = 24;

// Deterministic PRNG seeded by ticker so each display-only spark is stable across reloads.
function seededRandom(seed: string): () => number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    return () => {
        h += 0x6d2b79f5;
        let t = Math.imul(h ^ (h >>> 15), 1 | h);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

type MoverSeed = Omit<MoverRow, 'history' | 'baseline'>;

// Drift the walk toward the day's % change, so the sparkline agrees with the value in the row.
function withSpark(row: MoverSeed): MoverRow {
    const rand = seededRandom(row.ticker);
    const totalReturn = row.changePct / 100;
    const drift = totalReturn / SPARK_POINTS;
    const baseline = row.last / (1 + totalReturn);
    const history: number[] = [];
    let price = baseline;
    for (let i = 0; i < SPARK_POINTS; i++) {
        price *= 1 + drift + (rand() - 0.5) * 0.01;
        history.push(price);
    }
    return { ...row, history, baseline };
}

// Market-overview companies, promoted to full instruments below so they can be selected and streamed.
const TRENDING_SEED: MoverSeed[] = [
    { ticker: 'ZNTH', name: 'Zenith Mobility', last: 128.44, changePct: 9.82, volume: 54.1 },
    { ticker: 'PIXL', name: 'Pixelate Games', last: 61.2, changePct: -7.35, volume: 38.9 },
    { ticker: 'NMBS', name: 'Nimbus Cloud', last: 342.9, changePct: 6.91, volume: 27.4 },
    { ticker: 'FRGE', name: 'Forge Materials', last: 47.63, changePct: -5.88, volume: 61.7 },
    { ticker: 'BRWV', name: 'Brightwave Media', last: 205.11, changePct: 5.42, volume: 19.8 },
    { ticker: 'TDES', name: 'Tidewater Desal', last: 33.07, changePct: 4.77, volume: 22.5 },
    { ticker: 'KLPT', name: 'Kelpton Foods', last: 88.9, changePct: -4.13, volume: 15.2 },
    { ticker: 'HRBR', name: 'Harbor Freight Lines', last: 154.36, changePct: 3.86, volume: 12.9 },
    { ticker: 'OVLK', name: 'Overlook Finance', last: 276.5, changePct: -3.42, volume: 9.6 },
    { ticker: 'CRML', name: 'Caramel Retail', last: 42.18, changePct: 3.05, volume: 18.3 },
];

const MOST_ACTIVE_SEED: MoverSeed[] = [
    { ticker: 'SPRK', name: 'Sparkline Payments', last: 19.42, changePct: 2.14, volume: 182.6 },
    { ticker: 'VYPR', name: 'Viper Motors', last: 214.88, changePct: -1.77, volume: 154.3 },
    { ticker: 'DUNE', name: 'Dune Energy', last: 8.31, changePct: 4.52, volume: 141.9 },
    { ticker: 'ASTL', name: 'Astral Telecom', last: 63.7, changePct: 0.88, volume: 128.7 },
    { ticker: 'MTRX', name: 'Matrix Foundry', last: 97.05, changePct: -2.31, volume: 116.4 },
    { ticker: 'FNCH', name: 'Finch Analytics', last: 152.9, changePct: 1.46, volume: 103.8 },
    { ticker: 'GLNT', name: 'Galleon Shipping', last: 44.22, changePct: -0.63, volume: 95.2 },
    { ticker: 'POLR', name: 'Polaris Air', last: 71.15, changePct: 3.19, volume: 88.5 },
    { ticker: 'WRTH', name: 'Wraith Security', last: 289.4, changePct: -1.02, volume: 79.1 },
    { ticker: 'BLDR', name: 'Boulder Construction', last: 56.83, changePct: 0.74, volume: 71.6 },
];

export const TRENDING_STOCKS: MoverRow[] = TRENDING_SEED.map(withSpark);
export const MOST_ACTIVE_STOCKS: MoverRow[] = MOST_ACTIVE_SEED.map(withSpark);

const SECTORS = ['Technology', 'Energy & Utilities', 'Healthcare & Consumer'];

// Synthesise a mover's missing fundamentals deterministically so it becomes a selectable instrument.
function moverToInstrument(row: MoverSeed, index: number): Instrument {
    const rand = seededRandom(`${row.ticker}-fundamentals`);
    const baseline = row.last / (1 + row.changePct / 100);
    return {
        ticker: row.ticker,
        name: row.name,
        seed: baseline,
        volatility: 0.0012 + rand() * 0.0026,
        sector: SECTORS[index % SECTORS.length],
        sentiment: Math.round(30 + rand() * 50),
        beta: Math.round((0.6 + rand() * 1.2) * 100) / 100,
        analystRating: Math.round(30 + rand() * 60),
    };
}

export const MOVER_INSTRUMENTS: Instrument[] = [...TRENDING_SEED, ...MOST_ACTIVE_SEED].map(moverToInstrument);

// Every tradable instrument: watchlist names plus the market-overview movers.
export const ALL_INSTRUMENTS: Instrument[] = [...INSTRUMENTS, ...MOVER_INSTRUMENTS];

// Per-tick volatility for the market-overview movers (trending / most-active).
const MOVER_VOLATILITY = 0.0025;

/**
 * A live feed for a market-overview list. Advances each row's price on every
 * `tick()`: the price random-walks, the % change is re-derived from the fixed
 * baseline (so it agrees with the trend sparkline), volume jitters, and the
 * sparkline history scrolls. Row order is fixed by the seed — values stream in place.
 */
export class MoverFeed {
    private readonly rows: MoverRow[];

    constructor(seed: MoverRow[]) {
        this.rows = seed.map((row) => ({ ...row, history: [...row.history] }));
    }

    snapshot(): MoverRow[] {
        return this.rows.map((row) => ({ ...row, history: [...row.history] }));
    }

    tick(): MoverRow[] {
        for (const row of this.rows) {
            const last = nextClose(row.last, MOVER_VOLATILITY);
            row.last = last;
            row.changePct = (last / row.baseline - 1) * 100;
            row.volume = Math.max(0.1, row.volume + (Math.random() - 0.5) * row.volume * 0.05);
            row.history = [...row.history.slice(1), last];
        }
        return this.snapshot();
    }
}

export const BAR_INTERVAL_MS = 60_000; // one-minute bars
const HISTORY_BARS = 240;
// Baseline retention: the widest range button (240 bars) plus headroom.
export const MAX_BARS = 480;
// Ceiling for a range that pins history (see `tick`). It also bounds the catch-up the chart applies
// in one go when the view returns to the live edge, so it trades the far edge of a very long pinned
// session (~1.4h at the default speed) against that flush staying cheap.
export const MAX_RETAINED_BARS = 10_000;
const VOLUME_BASE = 1_800;

// --- synthetic price generation ----------------------------------------------

function nextClose(prevClose: number, volatility: number): number {
    // Random walk with a slight mean-reverting drift so prices stay in a sane band.
    const shock = (Math.random() - 0.5) * 2 * volatility * prevClose;
    const drift = (Math.random() - 0.48) * volatility * prevClose * 0.5;
    return Math.max(1, prevClose + shock + drift);
}

// --- streaming gauge metrics --------------------------------------------------
// Metrics mean-revert toward the baseline on every tick so they never run away.

export interface GaugeMetrics {
    sentiment: number;
    beta: number;
    analystRating: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Random walk with mean reversion toward `baseline`, clamped to [min, max]. */
function driftToward(value: number, baseline: number, step: number, min: number, max: number): number {
    const shock = (Math.random() - 0.5) * 2 * step;
    const pull = (baseline - value) * 0.05;
    return clamp(value + shock + pull, min, max);
}

function makeBar(time: number, open: number, close: number, volatility: number): Bar {
    const spread = Math.abs(close - open) + Math.random() * volatility * open * 2;
    const high = Math.max(open, close) + Math.random() * spread;
    const low = Math.min(open, close) - Math.random() * spread;
    const volume = Math.round(VOLUME_BASE * (0.4 + Math.random() * 1.2));
    return { time, open, high, low, close, volume };
}

function seedHistory(instrument: Instrument, now: number): Bar[] {
    const bars: Bar[] = [];
    let prevClose = instrument.seed;
    const start = now - HISTORY_BARS * BAR_INTERVAL_MS;
    for (let i = 0; i < HISTORY_BARS; i++) {
        const open = prevClose;
        const close = nextClose(open, instrument.volatility);
        const bar = makeBar(start + i * BAR_INTERVAL_MS, open, close, instrument.volatility);
        bars.push(bar);
        prevClose = close;
    }
    return bars;
}

/**
 * A live feed for a single instrument. Appends a fresh bar on each `tick()` and retains a rolling
 * window of them — the baseline window, extended to cover whatever the UI reports as on screen.
 */
export class MarketFeed {
    readonly instrument: Instrument;
    private readonly bars: Bar[];
    // `bars[0]` is not a stable session reference once the window drops its oldest bar; capture the open once.
    private readonly openPrice: number;
    private readonly gaugeMetrics: GaugeMetrics;

    constructor(instrument: Instrument, now: number) {
        this.instrument = instrument;
        this.bars = seedHistory(instrument, now);
        this.openPrice = this.bars[0].open;
        this.gaugeMetrics = {
            sentiment: instrument.sentiment,
            beta: instrument.beta,
            analystRating: instrument.analystRating,
        };
    }

    /** Current gauge metrics (a copy, so React sees a new reference each update). */
    metrics(): GaugeMetrics {
        return { ...this.gaugeMetrics };
    }

    private driftMetrics(): void {
        const m = this.gaugeMetrics;
        const { sentiment, beta, analystRating } = this.instrument;
        m.sentiment = Math.round(driftToward(m.sentiment, sentiment, 2, 0, 100));
        m.beta = Math.round(driftToward(m.beta, beta, 0.02, 0, 2) * 100) / 100;
        m.analystRating = Math.round(driftToward(m.analystRating, analystRating, 2, 0, 100));
    }

    /** The current bar window (a copy, so React sees a new reference each update). */
    snapshot(): Bar[] {
        return this.bars.slice();
    }

    /** Recent close prices (oldest first) for the watchlist trend sparkline. */
    closeHistory(count = SPARK_POINTS): number[] {
        return this.bars.slice(-count).map((bar) => bar.close);
    }

    /** Opening value of the session — the reference for the session change. */
    get sessionOpen(): number {
        return this.openPrice;
    }

    /** Session quote: latest price and change since the session open. */
    quote(): { last: number; change: number; changePct: number } {
        const last = this.bars[this.bars.length - 1];
        const change = last.close - this.openPrice;
        return { last: last.close, change, changePct: (change / this.openPrice) * 100 };
    }

    /**
     * Advance the feed one step, appending a fresh bar. Bars newer than `retainFrom` (epoch ms, the
     * oldest bar the UI has on screen) are kept however far back they go, so a viewer zoomed into a
     * time range never has it emptied out underneath them. Read the window with `snapshot()`.
     */
    tick(retainFrom?: number): void {
        const prev = this.bars[this.bars.length - 1];
        const { volatility } = this.instrument;
        const open = prev.close;
        const close = nextClose(open, volatility);
        const bar = makeBar(prev.time + BAR_INTERVAL_MS, open, close, volatility);

        this.bars.push(bar);
        this.evict(retainFrom);

        this.driftMetrics();
    }

    /**
     * Catch a lazily-ticked feed up to `ticks` steps behind the live ones. Only the retained window
     * survives eviction, so simulating every missed step would burn thousands of iterations on the
     * click that selects the feed; the skipped steps still advance the shared time grid.
     */
    catchUp(ticks: number): void {
        if (ticks <= 0) return;
        const simulated = Math.min(ticks, MAX_BARS);
        const skipped = ticks - simulated;
        if (skipped > 0) {
            // Carry the last close forward so the price series stays continuous across the jump.
            const last = this.bars[this.bars.length - 1];
            this.bars.splice(0, this.bars.length, { ...last, time: last.time + skipped * BAR_INTERVAL_MS });
        }
        for (let i = 0; i < simulated; i++) {
            this.tick();
        }
    }

    /** Drop leading bars that are neither within the baseline window nor on screen. */
    private evict(retainFrom?: number): void {
        const latest = this.bars[this.bars.length - 1].time;
        // The older of the two floors wins, so a displayed range only ever retains more, never less.
        const floor = Math.min(retainFrom ?? Infinity, latest - (MAX_BARS - 1) * BAR_INTERVAL_MS);

        let drop = 0;
        while (drop < this.bars.length - 1 && this.bars[drop].time < floor) {
            drop++;
        }
        drop = Math.max(drop, this.bars.length - MAX_RETAINED_BARS);
        if (drop > 0) this.bars.splice(0, drop);
    }
}

// --- streaming peer performance (for the profile peer chart) -----------------
// Sampled in lockstep with the candlestick chart so the time axes stay aligned.

const SPX_SEED = 5200;
const SPX_VOLATILITY = 0.0008;

// Sector-only peers: not tradable, so they stay out of INSTRUMENTS but still get a live price.
interface PeerCompany {
    ticker: string;
    sector: string;
    seed: number;
    volatility: number;
    beta: number;
}

const EXTRA_PEERS: PeerCompany[] = [
    { ticker: 'CIRQ', sector: 'Technology', seed: 260.0, volatility: 0.0021, beta: 1.2 },
    { ticker: 'BYTE', sector: 'Technology', seed: 118.0, volatility: 0.0026, beta: 1.35 },
    { ticker: 'TNSR', sector: 'Technology', seed: 512.0, volatility: 0.0033, beta: 1.6 },
    { ticker: 'NEXA', sector: 'Technology', seed: 184.0, volatility: 0.0019, beta: 1.1 },
    { ticker: 'PHTN', sector: 'Technology', seed: 336.0, volatility: 0.0029, beta: 1.5 },
    { ticker: 'KRNL', sector: 'Technology', seed: 92.0, volatility: 0.0024, beta: 1.3 },
    { ticker: 'HYDR', sector: 'Energy & Utilities', seed: 71.0, volatility: 0.0015, beta: 0.7 },
    { ticker: 'SOLR', sector: 'Energy & Utilities', seed: 45.0, volatility: 0.0026, beta: 1.25 },
    { ticker: 'ATOM', sector: 'Energy & Utilities', seed: 133.0, volatility: 0.0011, beta: 0.6 },
    { ticker: 'WIND', sector: 'Energy & Utilities', seed: 58.0, volatility: 0.0022, beta: 1.05 },
    { ticker: 'GEOT', sector: 'Energy & Utilities', seed: 108.0, volatility: 0.0013, beta: 0.65 },
    { ticker: 'FSSN', sector: 'Energy & Utilities', seed: 39.0, volatility: 0.0018, beta: 0.9 },
    { ticker: 'MEDX', sector: 'Healthcare & Consumer', seed: 224.0, volatility: 0.0029, beta: 1.4 },
    { ticker: 'GENE', sector: 'Healthcare & Consumer', seed: 96.0, volatility: 0.0034, beta: 1.5 },
    { ticker: 'CART', sector: 'Healthcare & Consumer', seed: 61.0, volatility: 0.0013, beta: 0.65 },
    { ticker: 'NURO', sector: 'Healthcare & Consumer', seed: 148.0, volatility: 0.0031, beta: 1.45 },
    { ticker: 'DERM', sector: 'Healthcare & Consumer', seed: 82.0, volatility: 0.0017, beta: 0.85 },
    { ticker: 'ORGN', sector: 'Healthcare & Consumer', seed: 195.0, volatility: 0.0023, beta: 1.15 },
];

const ALL_PEER_COMPANIES: PeerCompany[] = [
    ...ALL_INSTRUMENTS.map((inst) => ({
        ticker: inst.ticker,
        sector: inst.sector,
        seed: inst.seed,
        volatility: inst.volatility,
        beta: inst.beta,
    })),
    ...EXTRA_PEERS,
];

const PEER_BETAS = new Map(ALL_PEER_COMPANIES.map((company) => [company.ticker, company.beta]));

/** The selected ticker first, followed by the other companies in its sector. */
export function sectorPeers(ticker: string): string[] {
    const sector = ALL_INSTRUMENTS.find((inst) => inst.ticker === ticker)!.sector;
    const inSector = (company: PeerCompany) => company.sector === sector && company.ticker !== ticker;
    const peers = ALL_PEER_COMPANIES.filter(inSector).map((c) => c.ticker);
    return [ticker, ...peers];
}

export interface PerfRow {
    /** Sample timestamp (epoch ms); a stable id for matching incremental transactions. */
    id: number;
    date: Date;
    [ticker: string]: number | Date;
}

/** One cell of a peer-over-time heatmap: a value for one peer in one time bucket. */
export interface PeerHeatmapCell {
    /** Composite `time|peer` id; stable per cell for matching incremental transactions. */
    key: string;
    /** Time-bucket label (x axis). */
    time: string;
    /** Peer ticker (y axis). */
    peer: string;
    /** The value driving the cell colour. */
    value: number;
}

// Fixed one-minute wall-clock buckets, so a column keeps its colour as the feed streams.
const HEATMAP_BUCKET_MS = BAR_INTERVAL_MS;
const HEATMAP_BUCKETS = 30;

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

interface PeerSample {
    time: number;
    /** Stable Date for the ordinal-time axis; reused across ticks so existing
     *  points keep their identity and the axis doesn't rebuild every update. */
    date: Date;
    spx: number;
    prices: Record<string, number>;
}

/**
 * Streams one daily close per company and a synthetic S&P 500 index, keeping a
 * rolling one-year window shared across all peer selections.
 */
export class PeerPerformanceFeed {
    private readonly samples: PeerSample[] = [];
    private readonly prices: Record<string, number> = {};
    // Fixed rebase origin, so streaming a new day only appends a point; existing points never recompute.
    private readonly basePrices: Record<string, number> = {};
    private readonly baseSpx = SPX_SEED;
    private spx = SPX_SEED;
    private time: number;

    // OPTIMIZATION: a row depends only on its own immutable sample and the fixed origin, so it never
    // changes once computed.
    private perfCache = new WeakMap<PeerSample, PerfRow>();
    private perfCacheKey = '';
    // Settled buckets only: cells are fixed once a bucket has a stable predecessor in the window.
    private readonly spreadCache = new Map<number, PeerHeatmapCell[]>();
    private spreadCacheKey = '';

    constructor(now: number) {
        for (const company of ALL_PEER_COMPANIES) {
            this.prices[company.ticker] = company.seed;
            this.basePrices[company.ticker] = company.seed;
        }
        // advance() pre-increments time, so start one interval back to align with seedHistory()'s last bar.
        this.time = now - (HISTORY_BARS + 1) * BAR_INTERVAL_MS;
        for (let i = 0; i < HISTORY_BARS; i++) this.advance();
    }

    /** Advance the feed one interval: roll every price and the index forward. */
    tick(): void {
        this.advance();
    }

    private advance(): void {
        this.time += BAR_INTERVAL_MS;
        this.spx = nextClose(this.spx, SPX_VOLATILITY);
        const prices: Record<string, number> = {};
        for (const company of ALL_PEER_COMPANIES) {
            const next = nextClose(this.prices[company.ticker], company.volatility);
            this.prices[company.ticker] = next;
            prices[company.ticker] = next;
        }
        this.samples.push({ time: this.time, date: new Date(this.time), spx: this.spx, prices });
        if (this.samples.length > MAX_BARS) this.samples.shift();
    }

    /**
     * Beta-adjusted outperformance vs the S&P 500 for each ticker over the last
     * `count` points. Values are rebased to the feed's fixed origin, so a point's
     * value is stable frame-to-frame; a new tick appends one point and scrolls
     * the oldest off the left, like the candlestick chart.
     */
    relativePerformance(tickers: string[], count: number): PerfRow[] {
        const tickersKey = tickers.join(',');
        if (tickersKey !== this.perfCacheKey) {
            this.perfCache = new WeakMap();
            this.perfCacheKey = tickersKey;
        }
        const slice = this.samples.slice(-count);
        const marketReturnOf = (spx: number) => spx / this.baseSpx - 1;
        return slice.map((sample) => {
            const cached = this.perfCache.get(sample);
            if (cached) return cached;
            const row: PerfRow = { id: sample.time, date: sample.date };
            const marketReturn = marketReturnOf(sample.spx);
            for (const ticker of tickers) {
                const totalReturn = sample.prices[ticker] / this.basePrices[ticker] - 1;
                const beta = PEER_BETAS.get(ticker) ?? 1;
                row[ticker] = (totalReturn - beta * marketReturn) * 100;
            }
            this.perfCache.set(sample, row);
            return row;
        });
    }

    /** Group the most recent samples into up to `buckets` fixed wall-clock time buckets (oldest first). */
    private timeBuckets(buckets = HEATMAP_BUCKETS): PeerSample[][] {
        // Scan newest-first so cost tracks the window rather than the full sample history.
        const byKey = new Map<number, PeerSample[]>();
        for (let i = this.samples.length - 1; i >= 0; i--) {
            const sample = this.samples[i];
            const key = Math.floor(sample.time / HEATMAP_BUCKET_MS);
            let bucket = byKey.get(key);
            if (!bucket) {
                if (byKey.size === buckets) break;
                bucket = [];
                byKey.set(key, bucket);
            }
            bucket.unshift(sample);
        }
        return [...byKey.keys()].sort((a, b) => a - b).map((key) => byKey.get(key)!);
    }

    private computeBucketCells(
        bucket: PeerSample[],
        priorBucket: PeerSample[] | undefined,
        tickers: string[]
    ): PeerHeatmapCell[] {
        const label = bucketTimeLabel(bucket[0].time);
        const cells: PeerHeatmapCell[] = [];
        for (const ticker of tickers) {
            const moves: number[] = [];
            let prev = priorBucket?.at(-1)?.prices[ticker];
            for (const sample of bucket) {
                const price = sample.prices[ticker];
                if (prev != null && prev !== 0) moves.push((Math.abs(price - prev) / prev) * 100);
                prev = price;
            }
            cells.push({
                key: `${label}|${ticker}`,
                time: label,
                peer: ticker,
                value: round2(moves.length ? mean(moves) : 0),
            });
        }
        return cells;
    }

    /**
     * Price spread per peer per time bucket, as the mean absolute % move between
     * consecutive samples within the bucket. Defined against the previous sample
     * so it stays meaningful even when a bucket holds a single sample.
     */
    rollingSpread(tickers: string[], bucketCount = HEATMAP_BUCKETS): PeerHeatmapCell[] {
        const tickersKey = tickers.join(',');
        if (tickersKey !== this.spreadCacheKey) {
            this.spreadCache.clear();
            this.spreadCacheKey = tickersKey;
        }
        // One extra older bucket supplies predecessor context only; emit exactly the requested columns.
        const buckets = this.timeBuckets(bucketCount + 1);
        const emitStart = buckets.length > bucketCount ? 1 : 0;
        const lastIndex = buckets.length - 1;
        const liveKeys = new Set<number>();
        const cells: PeerHeatmapCell[] = [];
        for (let bucketIndex = emitStart; bucketIndex <= lastIndex; bucketIndex++) {
            const bucket = buckets[bucketIndex];
            const key = Math.floor(bucket[0].time / HEATMAP_BUCKET_MS);
            liveKeys.add(key);
            // Only the trailing bucket and buckets lacking a predecessor recompute each tick.
            const settled = bucketIndex > 0 && bucketIndex < lastIndex;
            let bucketCells = settled ? this.spreadCache.get(key) : undefined;
            if (!bucketCells) {
                bucketCells = this.computeBucketCells(bucket, buckets[bucketIndex - 1], tickers);
                if (settled) this.spreadCache.set(key, bucketCells);
            }
            for (const cell of bucketCells) cells.push(cell);
        }
        for (const key of this.spreadCache.keys()) {
            if (!liveKeys.has(key)) this.spreadCache.delete(key);
        }
        return cells;
    }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const bucketTimeLabel = (time: number): string => {
    const date = new Date(time);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
