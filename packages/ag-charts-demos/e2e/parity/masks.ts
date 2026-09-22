// Regions excluded from the pixel comparison, as CSS selectors per demo. Both screenshots are
// masked identically before comparing.
//
// Deliberately empty. A port is expected to match the React reference pixel for pixel: the CSS
// is shared and the charts are AG Charts either way. Add a selector only for chrome a framework
// cannot reproduce, with a comment saying what differs and why it is acceptable, so the entry is
// reviewed with the PR that needs it.
export const MASKS: Record<string, readonly string[]> = {
    financial: [],
    'web-analytics': [],
    procurement: [],
};
