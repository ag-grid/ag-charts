/**
 * Scroll to href location on page and update url
 */
export function smoothScrollIntoView({ href, skipReplaceUrl }: { href: string; skipReplaceUrl?: boolean }) {
    document.querySelector(href)?.scrollIntoView({
        behavior: 'smooth',
    });
    if (!skipReplaceUrl) {
        history.replaceState(undefined, '', href);
    }
}
