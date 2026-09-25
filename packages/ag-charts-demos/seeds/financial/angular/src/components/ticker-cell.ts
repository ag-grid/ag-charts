import { Component, computed, input, signal } from '@angular/core';
import { type ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';

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
@Component({
    selector: 'span[finTickerBadge]',
    host: { class: 'fin-ticker-badge', 'aria-hidden': 'true', '[attr.data-avatar]': 'avatar()' },
    template: '{{ ticker().charAt(0) }}',
})
export class TickerBadge {
    readonly ticker = input.required<string>();
    protected readonly avatar = computed(() => avatarIndex(this.ticker()));
}

/**
 * A market cell: the coloured initial, then the cell's own text. The badge is a
 * recognition aid for scanning a long board, so it keys off the ticker even when the
 * column shows the company name.
 */
@Component({
    selector: 'span[finTickerCell]',
    imports: [TickerBadge],
    host: { class: 'fin-ticker' },
    template: '<span finTickerBadge [ticker]="ticker()"></span><span class="fin-ticker-label">{{ value() }}</span>',
})
export class TickerCell implements ICellRendererAngularComp {
    protected readonly ticker = signal('');
    protected readonly value = signal<string | undefined>(undefined);

    agInit(params: ICellRendererParams<{ ticker: string }, string>): void {
        this.update(params);
    }

    refresh(params: ICellRendererParams<{ ticker: string }, string>): boolean {
        this.update(params);
        return true;
    }

    private update({ value, data }: ICellRendererParams<{ ticker: string }, string>): void {
        this.ticker.set(data?.ticker ?? '');
        this.value.set(value ?? undefined);
    }
}
