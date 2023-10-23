/**
 * Scroll to href location on page and update url
 */
export function smoothScrollIntoView({
    id,
    offset = 0,
    skipReplaceUrl,
}: {
    id: string;
    skipReplaceUrl?: boolean;
    offset?: number;
}) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }

    if (offset) {
        const top = element.offsetTop + offset;
        window.scrollTo({ behavior: 'smooth', top });
    } else {
        element.scrollIntoView({ behavior: 'smooth' });
    }

    if (!skipReplaceUrl) {
        history.replaceState(undefined, '', `#${id}`);
    }
}
