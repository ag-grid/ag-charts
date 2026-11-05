import { Component } from '@angular/core';

const ACTIONS = ['Settings', 'Help', 'Log out'];

/**
 * Account actions. Placeholders: the demo has no settings, help centre or session, so none of them act.
 * `aria-disabled` rather than `disabled` keeps them focusable, so the title explaining why can be reached.
 *
 * The host is the React root `ul.pc-side-actions`. Each action's icon is the React `Icon` wrapper
 * around that action's glyph, written out per action.
 */
@Component({
    selector: 'ul[pcSidebarActions]',
    host: { class: 'pc-side-actions', 'aria-label': 'Account' },
    template: `
        @for (label of actions; track label) {
            <li>
                <!-- Titled because the label beside it is hidden in the collapsed layout. -->
                <button
                    type="button"
                    class="pc-side-action"
                    aria-disabled="true"
                    [title]="label + ' · Not available in this demo'"
                >
                    <svg
                        class="pc-side-action-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        focusable="false"
                    >
                        @switch (label) {
                            @case ('Settings') {
                                <path
                                    d="M6.49 3.34 6.83 1.35h2.34l.34 1.99 1.77 1.02 1.89-.7 1.17 2.03-1.55 1.29v2.04l1.55 1.29-1.17 2.03-1.89-.7-1.77 1.02-.34 1.99H6.83l-.34-1.99-1.77-1.02-1.89.7-1.17-2.03 1.55-1.29V6.98L1.66 5.69l1.17-2.03 1.89.7Z"
                                />
                                <circle cx="8" cy="8" r="2" />
                            }
                            @case ('Help') {
                                <circle cx="8" cy="8" r="6.5" />
                                <path d="M6.25 6.25a1.75 1.75 0 1 1 2.5 1.6c-.5.23-.75.6-.75 1.15v.25" />
                                <circle cx="8" cy="11.5" r="0.4" fill="currentColor" />
                            }
                            @case ('Log out') {
                                <path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6M10.5 11 13.5 8l-3-3M13.5 8H6" />
                            }
                        }
                    </svg>
                    <span class="pc-side-action-label">{{ label }}</span>
                </button>
            </li>
        }
    `,
})
export class SidebarActions {
    protected readonly actions = ACTIONS;
}
