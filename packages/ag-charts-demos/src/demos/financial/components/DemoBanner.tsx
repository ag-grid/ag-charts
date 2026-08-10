import { useState } from 'react';

function InfoIcon() {
    return (
        <svg
            className="fin-banner-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
        </svg>
    );
}

export function DemoBanner() {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    return (
        <div className="fin-banner" role="note">
            <InfoIcon />
            <span className="fin-banner-text">
                This is a sample application showcasing AG Charts and AG Grid features. All data shown is synthetic and
                randomly generated for demonstration purposes only.
            </span>
            <button
                type="button"
                className="fin-banner-dismiss"
                aria-label="Dismiss notice"
                onClick={() => setDismissed(true)}
            >
                ✕
            </button>
        </div>
    );
}
