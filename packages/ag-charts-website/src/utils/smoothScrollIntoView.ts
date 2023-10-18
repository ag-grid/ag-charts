/**
 * Scroll to href location on page and update url
 */
export function smoothScrollIntoView({
    href,
    skipReplaceUrl,
    offset = 0,
}: {
    href: string;
    skipReplaceUrl?: boolean;
    offset?: number;
}) {
    const element = document.getElementById(href.substring(1));
    if (!element) {
        return;
    }

    const elementOffsetTop = element.offsetTop ?? 0;
    if (offset) {
        const top = elementOffsetTop + offset;
        window.scrollTo({
            behavior: 'smooth',
            top,
        });
    } else {
        element.scrollIntoView({
            behavior: 'smooth',
        });
    }

    if (!skipReplaceUrl) {
        history.replaceState(undefined, '', href);
    }
}
