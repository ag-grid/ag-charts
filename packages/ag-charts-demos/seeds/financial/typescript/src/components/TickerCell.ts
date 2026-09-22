import { type ICellRendererComp, type ICellRendererParams } from 'ag-grid-community';

import { h } from '../dom';

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
export function tickerBadge(ticker: string): HTMLSpanElement {
    return h(
        'span',
        { class: 'fin-ticker-badge', 'data-avatar': avatarIndex(ticker), 'aria-hidden': 'true' },
        ticker.charAt(0)
    );
}

/**
 * A market cell: the coloured initial, then the cell's own text. The badge is a
 * recognition aid for scanning a long board, so it keys off the ticker even when the
 * column shows the company name.
 */
export class TickerCell implements ICellRendererComp<{ ticker: string }> {
    // `data-avatar` is declared up front so the attributes keep React's order once `render` sets it.
    private readonly badge = h('span', { class: 'fin-ticker-badge', 'data-avatar': '0', 'aria-hidden': 'true' });
    private readonly label = h('span', { class: 'fin-ticker-label' });
    private readonly eGui = h('span', { class: 'fin-ticker' }, this.badge, this.label);

    init(params: ICellRendererParams<{ ticker: string }, string>) {
        this.render(params);
    }

    getGui() {
        return this.eGui;
    }

    refresh(params: ICellRendererParams<{ ticker: string }, string>) {
        this.render(params);
        return true;
    }

    private render({ value, data }: ICellRendererParams<{ ticker: string }, string>) {
        const ticker = data?.ticker ?? '';
        this.badge.setAttribute('data-avatar', String(avatarIndex(ticker)));
        this.badge.textContent = ticker.charAt(0);
        this.label.textContent = value ?? '';
    }
}
