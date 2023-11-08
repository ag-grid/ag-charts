import { type HeadingDataEntry, initScrolledHeadingTriggers } from '@utils/initScrolledHeadingTriggers';
import { browserHistory } from '@utils/navigation';
import type { MarkdownHeading } from 'astro';
import { useCallback, useEffect, useState } from 'react';

const SIDE_MENU_SELECTOR = '#side-menu';

interface Props {
    headings: MarkdownHeading[];
}

function clearAllActiveClasses() {
    document.querySelectorAll(`${SIDE_MENU_SELECTOR} a`).forEach((elem) => elem.classList.remove('active'));
}

function setMenuIdSelectorActive(id: string) {
    const sideMenuLinkSelector = `${SIDE_MENU_SELECTOR} a[href="#${id}"]`;
    document.querySelector(sideMenuLinkSelector)?.classList.add('active');
}

function useUpdateMenuOnHashChange({ currentVisibleHeadings }: { currentVisibleHeadings: HeadingDataEntry[] }) {
    useEffect(() => {
        return browserHistory?.listen(({ location }) => {
            const currentHash = location.hash;
            const hashIndex = currentVisibleHeadings?.findIndex(([id]) => {
                const hashPrefix = `#${id}`;
                return currentHash.startsWith(hashPrefix);
            });

            if (hashIndex > 0) {
                clearAllActiveClasses();

                const [visibleTabId] = currentVisibleHeadings[hashIndex];
                setMenuIdSelectorActive(visibleTabId);
            }
        });
    }, [currentVisibleHeadings]);
}

function useUpdateMenuOnScroll({
    headings,
    setCurrentVisibleHeadings,
}: {
    headings: MarkdownHeading[];
    setCurrentVisibleHeadings: (headings: HeadingDataEntry[]) => void;
}) {
    const handleScrollTrigger = useCallback(
        ({ topVisibleId, visibleHeadings }: { topVisibleId: string; visibleHeadings: HeadingDataEntry[] }) => {
            setCurrentVisibleHeadings(visibleHeadings);

            clearAllActiveClasses();

            const currentHash = window.location.hash;
            const hashIndex = visibleHeadings.findIndex(([id]) => {
                const hashPrefix = `#${id}`;
                return currentHash.startsWith(hashPrefix);
            });
            const visibleTabIndex = visibleHeadings.findIndex(([id]) => {
                const tabButton = document.getElementById(id)?.querySelector('button');

                return tabButton?.classList.contains('active');
            });

            let sideMenuLinkId;
            // Prioritise hash selection over tab selection for initial load, where the tab needs time to catch up
            if (hashIndex > 0) {
                const [visibleTabId] = visibleHeadings[hashIndex];
                sideMenuLinkId = visibleTabId;
            } else if (visibleTabIndex > 0) {
                const [visibleTabId] = visibleHeadings[visibleTabIndex];
                sideMenuLinkId = visibleTabId;
            } else {
                sideMenuLinkId = topVisibleId;
            }

            setMenuIdSelectorActive(sideMenuLinkId);
        },
        []
    );

    useEffect(() => {
        return initScrolledHeadingTriggers({
            headings,
            onScrollTrigger: handleScrollTrigger,
        });
    }, []);
}

export function useSideNavigationScrolling({ headings }: Props) {
    const [currentVisibleHeadings, setCurrentVisibleHeadings] = useState<HeadingDataEntry[]>([]);

    useUpdateMenuOnHashChange({ currentVisibleHeadings });
    useUpdateMenuOnScroll({ headings, setCurrentVisibleHeadings });
}
