import { h } from '../dom';

interface EmptyStateProps {
    message: string;
    hint?: string;
}

// Per-widget empty state, so one data-less chart doesn't render a broken axis.
export function emptyState({ message, hint }: EmptyStateProps): HTMLDivElement {
    return h(
        'div',
        { class: 'pc-empty' },
        h('span', { class: 'pc-empty-icon', 'aria-hidden': 'true' }, '◔'),
        h('span', {}, message),
        hint && h('span', { class: 'pc-card-sub' }, hint)
    );
}
