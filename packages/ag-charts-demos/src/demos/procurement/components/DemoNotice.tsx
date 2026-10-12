import { type CSSProperties, useRef, useState } from 'react';

const NOTICE_ID = 'pc-demo-notice';
const GAP = 6;
const EDGE = 12;

function InfoIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
        </svg>
    );
}

// Fixed, not absolute: the scrolling side bar would clip it. Hover-only, so it never follows a scroll.
function tipPosition(trigger: HTMLElement): CSSProperties {
    const rect = trigger.getBoundingClientRect();
    const vertical =
        rect.top > window.innerHeight / 2
            ? { bottom: window.innerHeight - rect.top + GAP }
            : { top: rect.bottom + GAP };
    const horizontal =
        rect.left > window.innerWidth / 2
            ? { right: window.innerWidth - rect.right, maxWidth: `min(320px, ${rect.right - EDGE}px)` }
            : { left: rect.left, maxWidth: `min(320px, ${window.innerWidth - rect.left - EDGE}px)` };
    return { ...vertical, ...horizontal };
}

export function DemoNotice() {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [tipStyle, setTipStyle] = useState<CSSProperties | null>(null);

    const show = () => {
        if (triggerRef.current != null) setTipStyle(tipPosition(triggerRef.current));
    };
    const hide = () => setTipStyle(null);

    return (
        <span className="pc-notice">
            <button
                ref={triggerRef}
                type="button"
                className="pc-notice-trigger"
                aria-label="About this demo"
                aria-describedby={tipStyle == null ? undefined : NOTICE_ID}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                onKeyDown={(event) => event.key === 'Escape' && hide()}
            >
                <InfoIcon />
            </button>
            {tipStyle != null && (
                <span id={NOTICE_ID} role="tooltip" className="pc-notice-tip" style={tipStyle}>
                    This is a sample application showcasing AG Charts and AG Grid features. All data shown is fictional
                    and for demonstration purposes only.
                </span>
            )}
        </span>
    );
}
