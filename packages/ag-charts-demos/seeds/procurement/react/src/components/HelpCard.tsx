import { useRef, useState } from 'react';

const FOCUSABLE =
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

function CloseIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/** The first focusable element after `element` in document order, outside it. */
function nextFocusable(element: HTMLElement): HTMLElement | undefined {
    return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
        (candidate) =>
            !element.contains(candidate) &&
            (element.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    );
}

/**
 * Where to get help with the workspace. Placeholder copy: the demo has no real support channel, so
 * nothing here is a link. Dismissal lasts for the session only, so a reload brings it back.
 */
export function HelpCard() {
    const sectionRef = useRef<HTMLElement>(null);
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    // The close button goes with the card, so focus moves on rather than dropping to the body.
    const dismiss = () => {
        if (sectionRef.current != null) nextFocusable(sectionRef.current)?.focus();
        setDismissed(true);
    };

    // Not a heading: the card sits before the page's h1 in the DOM.
    return (
        <section ref={sectionRef} className="pc-help" aria-labelledby="pc-help-title">
            <div className="pc-help-head">
                <p id="pc-help-title" className="pc-help-title">
                    Need a hand?
                </p>
                <button type="button" className="pc-help-close" aria-label="Dismiss help" onClick={dismiss}>
                    <CloseIcon />
                </button>
            </div>
            <p className="pc-help-body">
                See the Supply Desk guide on the intranet, or contact Procurement Systems at help@example.com.
            </p>
        </section>
    );
}
