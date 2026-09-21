import { type CustomCellRendererProps } from 'ag-grid-react';

// Number of avatar colours defined in financial.css as
// `.fin-ticker-badge[data-avatar='N']`. Keep the two in step.
const AVATAR_COLORS = 8;

/**
 * A stable colour slot for a ticker. FNV-1a rather than a character sum, so
 * same-letter tickers (ACME/ASTL) land on different colours instead of clustering.
 */
function avatarIndex(ticker: string): number {
    let hash = 2166136261;
    for (let i = 0; i < ticker.length; i++) {
        hash = Math.imul(hash ^ ticker.charCodeAt(i), 16777619);
    }
    return (hash >>> 0) % AVATAR_COLORS;
}

/**
 * A market's coloured initial. Decorative — it abbreviates a ticker that is always
 * shown beside it — so it stays out of the accessibility tree. Sized by context in
 * financial.css rather than by a prop.
 */
export function TickerBadge({ ticker }: { ticker: string }) {
    return (
        <span className="fin-ticker-badge" data-avatar={avatarIndex(ticker)} aria-hidden="true">
            {ticker.charAt(0)}
        </span>
    );
}

/**
 * A market cell: the coloured initial, then the cell's own text. The badge is a
 * recognition aid for scanning a long board, so it keys off the ticker even when the
 * column shows the company name.
 */
export function TickerCell({ value, data }: CustomCellRendererProps<{ ticker: string }, string>) {
    const ticker = data?.ticker ?? '';
    return (
        <span className="fin-ticker">
            <TickerBadge ticker={ticker} />
            <span className="fin-ticker-label">{value}</span>
        </span>
    );
}
