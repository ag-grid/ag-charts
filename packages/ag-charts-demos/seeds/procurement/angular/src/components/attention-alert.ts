import { Component, ElementRef, afterRenderEffect, input, output, signal, viewChild } from '@angular/core';

import type { AttentionAction, AttentionItem } from '../types';
import { PcButton } from '../ui';

const PANEL_ID = 'pc-attention-panel';

const SEVERITY_GLYPH = { bad: '▲' } as const;

/**
 * What Tab can reach inside the panel.
 *
 * Queried live on each Tab rather than captured on open, because the list is the panel's content
 * and it changes underneath: resolving an item removes its buttons, and the last item's action is
 * exactly where the trap wraps.
 */
const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** A decision taken on an item: the React `onResolve(item, action)` pair, as one output payload. */
export interface AttentionResolution {
    item: AttentionItem;
    action: AttentionAction;
}

/**
 * The worklist, behind the alert in her landing view's page head.
 *
 * A badge rather than a section: the count is what she needs at a glance, and the list itself is
 * only worth the screen while she is working it.
 *
 * Opening it is a deliberate act, so it opens over the page rather than pushing it down — the
 * views underneath keep their place, and a list she has read does not cost her the fold for the
 * rest of the day.
 *
 * The host is the React root `.pc-alert`. The React `AttentionList` renders a different root
 * element for each of its two states (`ul.pc-attention`, `div.pc-attention-clear`), which an Angular
 * component cannot, so it is rendered here as the two branches of an `@if` — the first thing she
 * sees: what needs a decision from her today, with the decisions available in place. Each item
 * resolves and disappears, so the list is a worklist that empties rather than a feed that
 * accumulates.
 */
@Component({
    selector: 'div[pcAttentionAlert]',
    imports: [PcButton],
    host: { class: 'pc-alert' },
    template: `
        <button
            #trigger
            pcBtn
            class="pc-icon-btn pc-alert-trigger"
            [attr.aria-label]="
                count() > 0
                    ? count() + ' ' + (count() === 1 ? 'item needs' : 'items need') + ' my attention'
                    : 'Nothing needs my attention'
            "
            aria-haspopup="dialog"
            [attr.aria-expanded]="open()"
            [attr.aria-controls]="open() ? panelId : null"
            (click)="open() ? close() : open.set(true)"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
                <path d="M13.7 20a2 2 0 0 1-3.4 0" />
            </svg>
            <!-- The count is on the label above too: a badge is a glyph, and a glyph is not a name. -->
            @if (count() > 0) {
                <span class="pc-alert-badge" aria-hidden="true">{{ count() }}</span>
            }
        </button>

        @if (open()) {
            <!-- Catches the click that dismisses; the page underneath is left as it is. -->
            <div class="pc-alert-scrim" (click)="close()"></div>
            <div
                #panel
                [id]="panelId"
                class="pc-alert-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Needs my attention"
                tabindex="-1"
            >
                <div class="pc-alert-panel-head">
                    <h2 class="pc-card-title">Needs my attention</h2>
                    <button pcBtn class="pc-icon-btn" aria-label="Close" (click)="close()">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m6 6 12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>
                @if (items().length === 0) {
                    <div class="pc-attention-clear">
                        <span class="pc-attention-clear-glyph" aria-hidden="true">✓</span>
                        <span
                            ><strong>Nothing needs your attention.</strong> No shipment is projected to miss the date
                            production needs it.</span
                        >
                    </div>
                } @else {
                    <ul class="pc-attention">
                        @for (item of items(); track item.itemId) {
                            <li [class]="'pc-attention-item is-' + item.severity">
                                <span class="pc-attention-glyph" aria-hidden="true">{{
                                    severityGlyph[item.severity]
                                }}</span>
                                <button type="button" class="pc-attention-body" (click)="selectItem(item.shipmentId)">
                                    <span class="pc-attention-title">{{ item.title }}</span>
                                    <span class="pc-attention-detail">{{ item.detail }}</span>
                                </button>
                                <span class="pc-attention-actions">
                                    @for (action of item.actions; track action.id) {
                                        <button pcBtn class="pc-btn-sm" (click)="resolve.emit({ item, action })">{{
                                            action.label
                                        }}</button>
                                    }
                                </span>
                            </li>
                        }
                    </ul>
                }
            </div>
        }
    `,
})
export class AttentionAlert {
    readonly items = input.required<AttentionItem[]>();
    /** Selecting an item selects its shipment on the orders tab, where the worklist lives. */
    readonly select = output<string>();
    /** Taking a decision resolves the item in place, removing it from the list. */
    readonly resolve = output<AttentionResolution>();

    protected readonly panelId = PANEL_ID;
    protected readonly severityGlyph = SEVERITY_GLYPH;
    protected readonly open = signal(false);
    protected readonly count = () => this.items().length;

    private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
    private readonly panel = viewChild<ElementRef<HTMLDivElement>>('panel');

    constructor() {
        // The panel is modal, so Tab has to be contained or focus walks into unreachable controls.
        // After render, as the React effect runs after commit: the panel exists only once `open` has rendered.
        afterRenderEffect((onCleanup) => {
            if (!this.open()) return;
            const panel = this.panel()?.nativeElement;
            if (!panel) return;

            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    this.close();
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
            onCleanup(() => document.removeEventListener('keydown', onKeyDown));
        });

        /**
         * Resolving an item removes the button that was just pressed, which drops focus to the body.
         * Put it back on the panel, or the next Tab starts from outside a dialog that is still open —
         * and a screen reader loses the dialog it was reading.
         */
        afterRenderEffect(() => {
            if (!this.open()) return;
            this.items().length;
            const panel = this.panel()?.nativeElement;
            if (panel && !panel.contains(document.activeElement)) panel.focus();
        });
    }

    // Focus returns to the alert on close, or a keyboard user is dropped at the top of the page.
    protected close(): void {
        this.open.set(false);
        this.trigger().nativeElement.focus();
    }

    // Following an item moves the workspace, so the panel gets out of the way; resolving one does not.
    protected selectItem(shipmentId: string): void {
        this.select.emit(shipmentId);
        this.close();
    }
}
