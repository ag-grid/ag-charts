import { h, svg } from '../dom';
import type { AttentionAction, AttentionItem } from '../types';
import { button } from '../ui';
import { attentionList } from './AttentionList';

interface AttentionAlertProps {
    items: AttentionItem[];
    /** Selecting an item selects its shipment on the orders tab, where the worklist lives. */
    onSelect: (shipmentId: string) => void;
    /** Taking a decision resolves the item in place, removing it from the list. */
    onResolve: (item: AttentionItem, action: AttentionAction) => void;
}

export interface AttentionAlert {
    el: HTMLDivElement;
    update(items: AttentionItem[]): void;
    /** The React unmount: drops the document listener the open panel holds. */
    destroy(): void;
}

const PANEL_ID = 'pc-attention-panel';

/**
 * What Tab can reach inside the panel.
 *
 * Queried live on each Tab rather than captured on open, because the list is the panel's content
 * and it changes underneath: resolving an item removes its buttons, and the last item's action is
 * exactly where the trap wraps.
 */
const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const triggerLabel = (count: number) =>
    count > 0 ? `${count} ${count === 1 ? 'item needs' : 'items need'} my attention` : 'Nothing needs my attention';

/**
 * The worklist, behind the alert in her landing view's page head.
 *
 * A badge rather than a section: the count is what she needs at a glance, and the list itself is
 * only worth the screen while she is working it.
 *
 * Opening it is a deliberate act, so it opens over the page rather than pushing it down — the
 * views underneath keep their place, and a list she has read does not cost her the fold for the
 * rest of the day.
 */
export function createAttentionAlert({ items, onSelect, onResolve }: AttentionAlertProps): AttentionAlert {
    let open = false;
    let badge: HTMLSpanElement | undefined;
    let scrim: HTMLDivElement | undefined;
    let panel: HTMLDivElement | undefined;
    let list: HTMLElement | undefined;

    const trigger = button(
        {
            class: 'pc-icon-btn pc-alert-trigger',
            'aria-label': triggerLabel(items.length),
            'aria-haspopup': 'dialog',
            'aria-expanded': 'false',
            onclick: () => (open ? close() : show()),
        },
        svg(
            'svg',
            { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
            svg('path', { d: 'M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7' }),
            svg('path', { d: 'M13.7 20a2 2 0 0 1-3.4 0' })
        )
    );
    const el = h('div', { class: 'pc-alert' }, trigger);

    // The panel is modal, so Tab has to be contained or focus walks into unreachable controls.
    const onKeyDown = (event: KeyboardEvent) => {
        if (!panel) return;
        if (event.key === 'Escape') {
            close();
            return;
        }
        if (event.key !== 'Tab') return;

        const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
            (element) => element.getClientRects().length > 0
        );
        const active = document.activeElement;
        if (focusable.length === 0) {
            // No controls but the close button in the all-clear state; hold focus on the panel itself.
            event.preventDefault();
            panel.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const inside = active instanceof Node && panel.contains(active);
        // Wrap at both ends, and pull stray focus (including off the panel itself) back into the list.
        if (event.shiftKey ? active === first || active === panel || !inside : active === last || !inside) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        }
    };

    // Following an item moves the workspace, so the panel gets out of the way; resolving one does not.
    const select = (shipmentId: string) => {
        onSelect(shipmentId);
        close();
    };

    function show() {
        if (open) return;
        open = true;
        list = attentionList({ items, onSelect: select, onResolve });
        // Catches the click that dismisses; the page underneath is left as it is.
        scrim = h('div', { class: 'pc-alert-scrim', onclick: close });
        panel = h(
            'div',
            {
                id: PANEL_ID,
                class: 'pc-alert-panel',
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': 'Needs my attention',
                tabindex: '-1',
            },
            h(
                'div',
                { class: 'pc-alert-panel-head' },
                h('h2', { class: 'pc-card-title' }, 'Needs my attention'),
                button(
                    { class: 'pc-icon-btn', 'aria-label': 'Close', onclick: close },
                    svg(
                        'svg',
                        { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
                        svg('path', { d: 'm6 6 12 12M18 6 6 18' })
                    )
                )
            ),
            list
        );
        el.append(scrim, panel);
        trigger.setAttribute('aria-expanded', 'true');
        trigger.setAttribute('aria-controls', PANEL_ID);
        document.addEventListener('keydown', onKeyDown);
        panel.focus();
    }

    function teardown() {
        if (!open) return;
        open = false;
        document.removeEventListener('keydown', onKeyDown);
        scrim?.remove();
        panel?.remove();
        scrim = panel = list = undefined;
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-controls');
    }

    // Focus returns to the alert on close, or a keyboard user is dropped at the top of the page.
    function close() {
        teardown();
        trigger.focus();
    }

    function render() {
        const count = items.length;
        trigger.setAttribute('aria-label', triggerLabel(count));
        // The count is on the label above too: a badge is a glyph, and a glyph is not a name.
        if (count > 0) {
            if (!badge) {
                badge = h('span', { class: 'pc-alert-badge', 'aria-hidden': 'true' });
                trigger.append(badge);
            }
            badge.textContent = String(count);
        } else if (badge) {
            badge.remove();
            badge = undefined;
        }
    }
    render();

    return {
        el,
        update(next) {
            if (next === items) return;
            const lengthChanged = next.length !== items.length;
            items = next;
            render();
            if (!open || !panel || !list) return;
            const replacement = attentionList({ items, onSelect: select, onResolve });
            list.replaceWith(replacement);
            list = replacement;
            /**
             * Resolving an item removes the button that was just pressed, which drops focus to the
             * body. Put it back on the panel, or the next Tab starts from outside a dialog that is
             * still open — and a screen reader loses the dialog it was reading.
             */
            if (lengthChanged && !panel.contains(document.activeElement)) panel.focus();
        },
        destroy: teardown,
    };
}
