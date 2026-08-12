import { type CustomCellRendererProps } from 'ag-grid-react';

// Number of avatar colours defined in financial.css as
// `.fin-ticker-badge[data-avatar='N']`. Keep the two in step.
const AVATAR_COLORS = 8;

/**
 * A stable colour slot for a ticker. FNV-1a rather than a character sum, so
 * same-letter tickers (ACME/ASTL) land on different colours instead of clustering.
 */
export function avatarIndex(ticker: string): number {
    let hash = 2166136261;
    for (let i = 0; i < ticker.length; i++) {
        hash = Math.imul(hash ^ ticker.charCodeAt(i), 16777619);
    }
    return (hash >>> 0) % AVATAR_COLORS;
}

/**
 * A market cell: a small coloured initial, then the cell's own text. The badge is a
 * recognition aid for scanning a long board, so it keys off the ticker even when the
 * column shows the company name.
 */
export function TickerCell({ value, data }: CustomCellRendererProps<{ ticker: string }, string>) {
    const ticker = data?.ticker ?? '';
    return (
        <span className="fin-ticker">
            {/* Decorative: the initial duplicates text already in the row. */}
            <span className="fin-ticker-badge" data-avatar={avatarIndex(ticker)} aria-hidden="true">
                {ticker.charAt(0)}
            </span>
            <span className="fin-ticker-label">{value}</span>
        </span>
    );
}
