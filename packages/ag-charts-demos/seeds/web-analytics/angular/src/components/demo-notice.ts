import { Component, signal } from '@angular/core';

const NOTICE_ID = 'wa-demo-notice';

@Component({
    selector: 'span[waDemoNotice]',
    host: { class: 'wa-notice' },
    template: `
        <button
            type="button"
            class="wa-notice-trigger"
            aria-label="About this demo"
            [attr.aria-describedby]="open() ? noticeId : null"
            (mouseenter)="open.set(true)"
            (mouseleave)="open.set(false)"
            (focus)="open.set(true)"
            (blur)="open.set(false)"
            (keydown.escape)="open.set(false)"
        >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
                <path d="M8 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
            </svg>
        </button>
        @if (open()) {
            <span [id]="noticeId" role="tooltip" class="wa-notice-tip">
                This is a sample application showcasing AG Charts and AG Grid features. All data shown is synthetic and
                randomly generated for demonstration purposes only.
            </span>
        }
    `,
})
export class DemoNotice {
    protected readonly noticeId = NOTICE_ID;
    protected readonly open = signal(false);
}
