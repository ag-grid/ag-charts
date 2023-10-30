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
