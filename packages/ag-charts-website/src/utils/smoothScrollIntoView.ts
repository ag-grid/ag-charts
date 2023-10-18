/**
 * Scroll to href location on page and update url
 */
export function smoothScrollIntoView({
    id,
    skipReplaceUrl,
    offset = 0,
}: {
    id: string;
    skipReplaceUrl?: boolean;
    offset?: number;
}) {
    const element = document.getElementById(id);
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
        history.replaceState(undefined, '', `#${id}`);
    }
}
