import { Component, ElementRef, signal, viewChild } from '@angular/core';

const NOTICE_ID = 'pc-demo-notice';
const GAP = 6;
const EDGE = 12;
/** Below this much room to the right, the tip opens to the left of the icon instead. */
const MIN_TIP_WIDTH = 200;

// Fixed, not absolute: the scrolling side bar would clip it. Hover-only, so it never follows a scroll.
// Lengths carry their unit here, which React's style object adds to a bare number.
function tipPosition(trigger: HTMLElement): Record<string, string> {
    const rect = trigger.getBoundingClientRect();
    const vertical: Record<string, string> =
        rect.top > window.innerHeight / 2
            ? { bottom: `${window.innerHeight - rect.bottom}px` }
            : { top: `${rect.top}px` };
    const roomRight = window.innerWidth - rect.right - GAP - EDGE;
    const horizontal: Record<string, string> =
        roomRight >= MIN_TIP_WIDTH
            ? { left: `${rect.right + GAP}px`, 'max-width': `min(320px, ${roomRight}px)` }
            : {
                  right: `${window.innerWidth - rect.left + GAP}px`,
                  'max-width': `min(320px, ${rect.left - GAP - EDGE}px)`,
              };
    return { ...vertical, ...horizontal };
}

/** The React `DemoNotice`: its root `.pc-notice` is this component's host. */
@Component({
    selector: 'span[pcDemoNotice]',
    host: { class: 'pc-notice' },
    template: `
        <button
            #trigger
            type="button"
            class="pc-notice-trigger"
            aria-label="About this demo"
            [attr.aria-describedby]="tipStyle() == null ? null : noticeId"
            (mouseenter)="show()"
            (mouseleave)="hide()"
            (focus)="show()"
            (blur)="hide()"
            (keydown)="$event.key === 'Escape' && hide()"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
                <path d="M8 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
            </svg>
        </button>
        @if (tipStyle(); as style) {
            <span [id]="noticeId" role="tooltip" class="pc-notice-tip" [style]="style"
                >This is a sample application showcasing AG Charts and AG Grid features. All data shown is fictional and
                for demonstration purposes only.</span
            >
        }
    `,
})
export class DemoNotice {
    protected readonly noticeId = NOTICE_ID;
    protected readonly tipStyle = signal<Record<string, string> | null>(null);
    private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

    protected show(): void {
        this.tipStyle.set(tipPosition(this.trigger().nativeElement));
    }

    protected hide(): void {
        this.tipStyle.set(null);
    }
}
