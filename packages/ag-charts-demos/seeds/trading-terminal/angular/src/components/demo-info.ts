import { Component, signal } from '@angular/core';

const NOTICE_ID = 'fin-demo-notice';

@Component({
    selector: 'span[finDemoInfo]',
    host: { class: 'fin-info' },
    template: `
        <button
            type="button"
            class="fin-info-trigger"
            aria-label="About this demo"
            [attr.aria-describedby]="open() ? noticeId : null"
            (mouseenter)="open.set(true)"
            (mouseleave)="open.set(false)"
            (focus)="open.set(true)"
            (blur)="open.set(false)"
            (keydown.escape)="open.set(false)"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
                <path d="M8 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
            </svg>
        </button>
        @if (open()) {
            <span [id]="noticeId" role="tooltip" class="fin-info-tooltip">
                This is a sample application showcasing AG Charts and AG Grid features. All data shown is synthetic and
                randomly generated for demonstration purposes only.
            </span>
        }
    `,
})
export class DemoInfo {
    protected readonly noticeId = NOTICE_ID;
    protected readonly open = signal(false);
}
