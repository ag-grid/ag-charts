import type { Heading } from 'src/types/markdoc';

interface Params {
    headings: Heading[];
    threshold?: number;
    onScrollTrigger: (params: {
        topVisibleId: string;
        visibleHeadings: HeadingDataEntry[];
        headingsData: Record<string, HeadingData>;
    }) => void;
}

export interface HeadingData {
    isVisible: boolean;
    index: number;
}

export type HeadingDataEntry = [string, HeadingData];

export function initScrolledHeadingTriggers({ headings, threshold = 0.2, onScrollTrigger }: Params) {
    const headingsData: Record<string, HeadingData> = {};

    const onIntersection = (entry: IntersectionObserverEntry) => {
        const headingId = entry.target.id;
        if (!headingsData[headingId]) {
            headingsData[headingId] = {} as HeadingData;
            headingsData[headingId].index = headings.findIndex(({ slug }) => slug === headingId);
        }
        headingsData[headingId].isVisible = entry.isIntersecting;

        const visibleHeadings = Object.entries(headingsData)
            .filter(([_key, { isVisible }]) => isVisible)
            // Sort top of the list first
            .sort(([_key1, { index: index1 }], [_key2, { index: index2 }]) => {
                return index1 - index2;
            });
        const [topVisibleEntry] = visibleHeadings;

        if (topVisibleEntry) {
            const topVisibleId = topVisibleEntry[0];
            onScrollTrigger({
                topVisibleId,
                visibleHeadings,
                headingsData,
            });
        }
    };
    const setupObservers = () => {
        const headingEls: (null | HTMLElement)[] = headings.map(({ slug }) => {
            return document.getElementById(slug);
        });

        headingEls.forEach((headingEl) => {
            if (headingEl) {
                observer.observe(headingEl);
            }
        });
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                onIntersection(entry);
            });
        },
        {
            root: null,
            threshold,
        }
    );

    setupObservers();
}
