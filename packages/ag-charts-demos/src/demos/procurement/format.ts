// Formatting helpers shared across the demo, so every chart, grid and KPI tile
// renders numbers the same way.

const numberFmt = new Intl.NumberFormat('en-US');
const percentFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const priceFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const fmtInt = (n: number) => numberFmt.format(Math.round(n));

/** Compact form for axis ticks and tiles: 1.2K, 3.4M. */
export const fmtCompact = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(Math.round(n));
};

/** Whole dollars — every spend, cost and budget figure in the app. */
export const fmtCurrency = (n: number) => currencyFmt.format(n);

/** Compact currency for axis ticks and dense tiles: $1.2M, $340K. */
export const fmtCurrencyCompact = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
    return currencyFmt.format(n);
};

/** Whole millions for spend axis ticks: $0, $20M. Pair with `wholeMillionStep` so no two ticks round alike. */
export const fmtCurrencyMillions = (n: number) => (n === 0 ? '$0' : `$${Math.round(n / 1_000_000)}M`);

/**
 * The smallest 1-2-5 step of whole millions that spans `max` in at most `maxTicks` intervals. Never
 * below $1M, since `fmtCurrencyMillions` would label finer ticks alike: suits spend in the millions only.
 */
export const wholeMillionStep = (max: number, maxTicks = 5) => {
    if (!Number.isFinite(max) || max <= 0) return 1_000_000;
    for (let magnitude = 1_000_000; ; magnitude *= 10) {
        for (const multiple of [1, 2, 5]) {
            const step = multiple * magnitude;
            if (max / step <= maxTicks) return step;
        }
    }
};

/** Unit prices need cents; totals do not. */
export const fmtPrice = (n: number) => priceFmt.format(n);

/** Every rate in the demo is a 0–1 fraction, read to one decimal place. */
export const fmtPct = (fraction: number) => `${percentFmt.format(fraction * 100)}%`;

/** A rate to the whole percent, for axis ticks that are themselves whole percents. */
export const fmtPctWhole = (fraction: number) => `${Math.round(fraction * 100)}%`;

/** A price as a multiple of list price: `1.04x`, or `1.0x` on an axis tick. */
export const fmtIndex = (index: number, digits = 2) => `${index.toFixed(digits)}x`;

/** A variance, where the sign is the point: `+3%` over contract, `-1%` under. */
export const fmtSignedPct = (fraction: number) =>
    `${fraction >= 0 ? '+' : '−'}${Math.round(Math.abs(fraction) * 100)}%`;

export const fmtDate = (value: number | Date) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Days remaining as a buyer would say it. `days` is signed: positive is time left,
 * negative is time already lost.
 */
export const fmtDaysToGo = (days: number) => {
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'due today';
    return `${days}d to go`;
};
