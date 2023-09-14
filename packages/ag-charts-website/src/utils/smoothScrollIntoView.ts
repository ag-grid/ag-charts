/**
 * Scroll to href location on page and update url
 */
export function smoothScrollIntoView({ href }: { href: string }) {
    document.querySelector(href)?.scrollIntoView({
        behavior: 'smooth',
    });
    history.replaceState(undefined, '', href);
}
