/** What Tab can reach: links, enabled form controls, and anything not taken out of the tab order. */
export const FOCUSABLE =
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
