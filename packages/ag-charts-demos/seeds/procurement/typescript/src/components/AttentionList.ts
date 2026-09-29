import { h } from '../dom';
import type { AttentionAction, AttentionItem } from '../types';
import { button } from '../ui';

const SEVERITY_GLYPH = { bad: '▲' } as const;

interface AttentionListProps {
    items: AttentionItem[];
    /** Selecting an item selects its shipment on the orders tab, where the worklist lives. */
    onSelect: (shipmentId: string) => void;
    /** Taking a decision resolves the item in place, removing it from the list. */
    onResolve: (item: AttentionItem, action: AttentionAction) => void;
}

/**
 * The first thing she sees: what needs a decision from her today, with the decisions
 * available in place.
 *
 * Deliberately not a chart. A workspace opens on what its owner has to do; a dashboard opens
 * on a summary of what happened. Each item resolves here and disappears, so the list is a
 * worklist that empties rather than a feed that accumulates.
 *
 * Built afresh for each set of items, as the React component re-renders it.
 */
export function attentionList({ items, onSelect, onResolve }: AttentionListProps): HTMLElement {
    if (items.length === 0) {
        return h(
            'div',
            { class: 'pc-attention-clear' },
            h('span', { class: 'pc-attention-clear-glyph', 'aria-hidden': 'true' }, '✓'),
            h(
                'span',
                {},
                h('strong', {}, 'Nothing needs your attention.'),
                ' No shipment is projected to miss the date production needs it.'
            )
        );
    }

    return h(
        'ul',
        { class: 'pc-attention' },
        ...items.map((item) =>
            h(
                'li',
                { class: `pc-attention-item is-${item.severity}` },
                h('span', { class: 'pc-attention-glyph', 'aria-hidden': 'true' }, SEVERITY_GLYPH[item.severity]),
                h(
                    'button',
                    { type: 'button', class: 'pc-attention-body', onclick: () => onSelect(item.shipmentId) },
                    h('span', { class: 'pc-attention-title' }, item.title),
                    h('span', { class: 'pc-attention-detail' }, item.detail)
                ),
                h(
                    'span',
                    { class: 'pc-attention-actions' },
                    ...item.actions.map((action) =>
                        button({ class: 'pc-btn-sm', onclick: () => onResolve(item, action) }, action.label)
                    )
                )
            )
        )
    );
}
