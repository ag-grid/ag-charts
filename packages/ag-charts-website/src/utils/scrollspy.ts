import type { MarkdownHeading } from 'astro';

interface ScrollSpyOptions {
    container?: Element;
    /**
     * Distance from the top of the scroll container at which a heading counts as reached. Defaults
     * to the container's `scroll-padding-top`, where anchor links land.
     */
    offset?: number;
}

// Absorbs fractional scroll positions, so a heading landed exactly on the offset line still counts.
const OFFSET_TOLERANCE = 2;

function getScrollPaddingTop(container: Element) {
    const scrollPaddingTop = Number.parseFloat(getComputedStyle(container).scrollPaddingTop);
    return Number.isFinite(scrollPaddingTop) ? scrollPaddingTop : 0;
}

export function scrollspy(
    headings: MarkdownHeading[],
    handler: (slug: string) => void,
    { container, offset }: ScrollSpyOptions = {}
) {
    const entries = headings
        .map<[string, HTMLElement | null]>(({ slug }) => [slug, document.getElementById(slug)])
        .filter(<T>(entry: [string, T]): entry is [string, NonNullable<T>] => entry[1] != null);

    function spyHandler() {
        const scrollContainer = container ?? document.documentElement;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        // Resolved per run rather than captured: the offset is breakpoint dependent.
        const threshold = scrollTop + (offset ?? getScrollPaddingTop(scrollContainer)) + OFFSET_TOLERANCE;

        let selectedSlug: string | undefined;
        let lastOffsetTop: number | undefined;

        for (const [slug, node] of entries) {
            // don't break if we reached the bottom of the scroll container
            if (node.offsetTop > threshold && scrollTop + clientHeight < scrollHeight) {
                break;
            }
            // duplicate node's offsetTop indicates multiple tab headings
            if (node.offsetTop !== lastOffsetTop || node.querySelector('button.active')) {
                selectedSlug = slug;
                lastOffsetTop = node.offsetTop;
            }
        }

        handler(selectedSlug ?? entries[0][0]);
    }

    spyHandler();

    const eventTarget = container ?? window;
    eventTarget.addEventListener('scroll', spyHandler);
    window.addEventListener('resize', spyHandler);
    return () => {
        eventTarget.removeEventListener('scroll', spyHandler);
        window.removeEventListener('resize', spyHandler);
    };
}
