import { useCallback, useEffect, useRef, useState } from 'react';

import type { AttentionAction, AttentionItem } from '../types';
import { Button } from '../ui';
import { AttentionList } from './AttentionList';

interface AttentionAlertProps {
    items: AttentionItem[];
    /** Selecting an item selects its shipment on the orders tab, where the worklist lives. */
    onSelect: (shipmentId: string) => void;
    /** Taking a decision resolves the item in place, removing it from the list. */
    onResolve: (item: AttentionItem, action: AttentionAction) => void;
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
export function AttentionAlert({ items, onSelect, onResolve }: AttentionAlertProps) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const count = items.length;

    // Focus returns to the alert on close, or a keyboard user is dropped at the top of the page.
    const close = useCallback(() => {
        setOpen(false);
        triggerRef.current?.focus();
    }, []);

    // The panel is modal, so Tab has to be contained or focus walks into unreachable controls.
    useEffect(() => {
        if (!open) return;
        const panel = panelRef.current;
        if (!panel) return;

        const onKeyDown = (event: KeyboardEvent) => {
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

        document.addEventListener('keydown', onKeyDown);
        panel.focus();
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, close]);

    /**
     * Resolving an item unmounts the button that was just pressed, which drops focus to the body.
     * Put it back on the panel, or the next Tab starts from outside a dialog that is still open —
     * and a screen reader loses the dialog it was reading.
     */
    useEffect(() => {
        if (!open) return;
        const panel = panelRef.current;
        if (panel && !panel.contains(document.activeElement)) panel.focus();
    }, [open, items.length]);

    // Following an item moves the workspace, so the panel gets out of the way; resolving one does not.
    const select = useCallback(
        (shipmentId: string) => {
            onSelect(shipmentId);
            close();
        },
        [onSelect, close]
    );

    return (
        <div className="pc-alert">
            <Button
                ref={triggerRef}
                className="pc-icon-btn pc-alert-trigger"
                aria-label={
                    count > 0
                        ? `${count} ${count === 1 ? 'item needs' : 'items need'} my attention`
                        : 'Nothing needs my attention'
                }
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? PANEL_ID : undefined}
                onClick={() => (open ? close() : setOpen(true))}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
                    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
                </svg>
                {/* The count is on the label above too: a badge is a glyph, and a glyph is not a name. */}
                {count > 0 && (
                    <span className="pc-alert-badge" aria-hidden="true">
                        {count}
                    </span>
                )}
            </Button>

            {open && (
                <>
                    {/* Catches the click that dismisses; the page underneath is left as it is. */}
                    <div className="pc-alert-scrim" onClick={close} />
                    <div
                        id={PANEL_ID}
                        ref={panelRef}
                        className="pc-alert-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Needs my attention"
                        tabIndex={-1}
                    >
                        <div className="pc-alert-panel-head">
                            <h2 className="pc-card-title">Needs my attention</h2>
                            <Button className="pc-icon-btn" aria-label="Close" onClick={close}>
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="m6 6 12 12M18 6 6 18" />
                                </svg>
                            </Button>
                        </div>
                        <AttentionList items={items} onSelect={select} onResolve={onResolve} />
                    </div>
                </>
            )}
        </div>
    );
}
