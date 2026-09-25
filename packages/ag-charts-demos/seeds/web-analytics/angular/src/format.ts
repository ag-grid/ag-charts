// Formatting helpers shared across the demo, so every chart, grid and KPI tile
// renders numbers the same way.

const numberFmt = new Intl.NumberFormat('en-US');
const percentFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const fmtInt = (n: number) => numberFmt.format(Math.round(n));

/** Compact form for axis ticks and tiles: 1.2K, 3.4M. */
export const fmtCompact = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(Math.round(n));
};

/** Every rate in the demo is a 0–1 fraction, so this is the only percentage formatter. */
export const fmtPct = (fraction: number) => `${percentFmt.format(fraction * 100)}%`;

export const fmtCurrency = (n: number) => currencyFmt.format(n);

export const fmtDuration = (seconds: number) => {
    const total = Math.round(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
};

export const fmtDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const fmtDateTime = (date: Date) =>
    date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** A signed delta with an arrow, for period-over-period comparison chips. */
export const fmtDelta = (fraction: number) => {
    const arrow = fraction >= 0 ? '▲' : '▼';
    return `${arrow} ${percentFmt.format(Math.abs(fraction) * 100)}%`;
};
