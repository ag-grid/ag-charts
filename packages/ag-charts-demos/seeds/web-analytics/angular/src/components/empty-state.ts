import { Component, input } from '@angular/core';

// Per-widget empty state, so one data-less chart doesn't render a broken axis.
@Component({
    selector: 'div[waEmptyState]',
    host: { class: 'wa-empty' },
    template: `
        <span class="wa-empty-icon" aria-hidden="true">◔</span>
        <span>{{ message() }}</span>
        @if (hint(); as hint) {
            <span class="wa-card-sub">{{ hint }}</span>
        }
    `,
})
export class EmptyState {
    readonly message = input.required<string>();
    readonly hint = input<string>();
}
