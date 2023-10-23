const HEADER_OFFSET = 65;

export function createLink(url: string, content: string) {
    const target = url.startsWith('http') ? '_blank' : '_self';
    return `<a href="${url}" target="${target}" rel="noreferrer">${content}</a>`;
}

export function scrollToId(id: string, { offset = HEADER_OFFSET }: { offset?: number } = {}) {
    // Scroll to top to reset scroll position
    window.scrollTo({ behavior: 'smooth', top: 0 });

    // Wait for one render cycle before scrolling to position
    setTimeout(() => {
        scrollIntoView(id, { offset, skipReplaceUrl: true });
    });
}

export function scrollIntoView(id: string, { offset = 0, skipReplaceUrl = false } = {}) {
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
