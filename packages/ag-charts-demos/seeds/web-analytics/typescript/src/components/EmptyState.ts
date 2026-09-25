import { type View, h, staticView } from '../dom';

// Per-widget empty state, so one data-less chart doesn't render a broken axis.
export function createEmptyState(message: string, hint?: string): View {
    return staticView(
        h(
            'div',
            { class: 'wa-empty' },
            h('span', { class: 'wa-empty-icon', 'aria-hidden': 'true' }, '◔'),
            h('span', {}, message),
            hint && h('span', { class: 'wa-card-sub' }, hint)
        )
    );
}
