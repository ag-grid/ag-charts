export type DataMode = 'bigint-small' | 'bigint-large' | 'iso-datetime';

const POINTS = 8;

// Beyond Number.MAX_SAFE_INTEGER, so these values must stay bigint end to end.
const LARGE_BASE = 9_007_199_254_740_993n;
const LARGE_STEP = 1_250_000_000_000_000_000n;

const SMALL_BASE = 1_000_000n;
const SMALL_STEP = 250_000n;

const ISO_START = Date.UTC(2024, 0, 15, 9, 0, 0);
const ISO_STEP_MS = 60 * 60 * 1000; // hourly

// A single row carries every key any series might read. Only the keys relevant
// to the active series + data mode are consumed; the rest are ignored.
export interface DataPoint {
    x: number | bigint | string;
    open: number | bigint;
    high: number | bigint;
    low: number | bigint;
    close: number | bigint;
    value: number | bigint;
    size: number;
    category: string;
}

// `rank` orders the o/h/l/c spread within a row (low < open < close < high).
function magnitude(mode: DataMode, i: number, rank: number): number | bigint {
    if (mode === 'iso-datetime') {
        // ISO mode keeps y values as plain numbers; the bigint/large-magnitude
        // exercise lives on the x (time) axis instead.
        return 40 + Math.round(Math.sin(i / 1.5) * 18) + rank * 4;
    }
    const base = mode === 'bigint-large' ? LARGE_BASE : SMALL_BASE;
    const step = mode === 'bigint-large' ? LARGE_STEP : SMALL_STEP;
    const rankOffset = mode === 'bigint-large' ? 200_000_000_000_000_000n : 100_000n;
    return base + step * BigInt(i) + rankOffset * BigInt(rank);
}

function xValue(mode: DataMode, i: number): number | bigint | string {
    if (mode === 'iso-datetime') {
        return new Date(ISO_START + i * ISO_STEP_MS).toISOString();
    }
    if (mode === 'bigint-large') {
        return LARGE_BASE + LARGE_STEP * BigInt(i);
    }
    return SMALL_BASE + SMALL_STEP * BigInt(i);
}

export function getData(mode: DataMode): DataPoint[] {
    return Array.from({ length: POINTS }, (_, i) => ({
        x: xValue(mode, i),
        low: magnitude(mode, i, 0),
        open: magnitude(mode, i, 2),
        close: magnitude(mode, i, 4),
        high: magnitude(mode, i, 6),
        value: magnitude(mode, i, 3),
        size: 6 + (i % 5) * 3,
        category: `Cat ${i + 1}`,
    }));
}
