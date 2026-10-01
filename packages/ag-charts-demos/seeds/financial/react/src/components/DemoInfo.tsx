import { useState } from 'react';

const NOTICE_ID = 'fin-demo-notice';

function InfoIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
        </svg>
    );
}

export function DemoInfo() {
    const [open, setOpen] = useState(false);

    return (
        <span className="fin-info">
            <button
                type="button"
                className="fin-info-trigger"
                aria-label="About this demo"
                aria-describedby={open ? NOTICE_ID : undefined}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
            >
                <InfoIcon />
            </button>
            {open && (
                <span id={NOTICE_ID} role="tooltip" className="fin-info-tooltip">
                    This is a sample application showcasing AG Charts and AG Grid features. All data shown is synthetic
                    and randomly generated for demonstration purposes only.
                </span>
            )}
        </span>
    );
}
