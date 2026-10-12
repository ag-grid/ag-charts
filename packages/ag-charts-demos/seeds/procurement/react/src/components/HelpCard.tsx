import { useState } from 'react';

function CloseIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/**
 * Where to get help with the workspace. Placeholder copy: the demo has no real support channel, so
 * nothing here is a link. Dismissal lasts for the session only, so a reload brings it back.
 */
export function HelpCard() {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    return (
        <section className="pc-help" aria-labelledby="pc-help-title">
            <div className="pc-help-head">
                <h2 id="pc-help-title" className="pc-help-title">
                    Need a hand?
                </h2>
                <button
                    type="button"
                    className="pc-help-close"
                    aria-label="Dismiss help"
                    onClick={() => setDismissed(true)}
                >
                    <CloseIcon />
                </button>
            </div>
            <p className="pc-help-body">
                See the Supply Desk guide on the intranet, or contact Procurement Systems at help@example.com.
            </p>
        </section>
    );
}
