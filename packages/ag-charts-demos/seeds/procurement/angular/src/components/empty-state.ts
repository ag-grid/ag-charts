import { Component, input } from '@angular/core';

/** Per-widget empty state, so one data-less chart doesn't render a broken axis. The host is the React root `.pc-empty`. */
@Component({
    selector: 'div[pcEmptyState]',
    host: { class: 'pc-empty' },
    template: `
        <span class="pc-empty-icon" aria-hidden="true">◔</span>
        <span>{{ message() }}</span>
        @if (hint()) {
            <span class="pc-card-sub">{{ hint() }}</span>
        }
    `,
})
export class EmptyState {
    readonly message = input.required<string>();
    readonly hint = input<string>();
}
