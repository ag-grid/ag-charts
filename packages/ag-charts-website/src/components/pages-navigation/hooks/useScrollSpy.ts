import { useLocation } from '@ag-website-shared/utils/navigation';
import { scrollspy } from '@utils/scrollspy';
import type { MarkdownHeading } from 'astro';
import { useEffect, useRef } from 'react';

export function useScrollSpy({
    headings,
    delayedScrollSpy,
}: {
    headings: MarkdownHeading[];
    /**
     * Delay scroll spy running, so the UI has time to render
     */
    delayedScrollSpy?: boolean;
}) {
    const menuRef = useRef<HTMLElement>(null);
    const location = useLocation();

    function handleScrollSpy(slug: string) {
        if (menuRef.current == null) return;
        for (const navItem of menuRef.current.querySelectorAll('a')) {
            navItem.classList.toggle('active', navItem.getAttribute('href') === `#${slug}`);
        }
    }

    useEffect(() => {
        let stopScrollSpy: (() => void) | undefined;
        let delayTimeout: ReturnType<typeof setTimeout> | undefined;

        function runScrollSpy() {
            stopScrollSpy = scrollspy(headings, handleScrollSpy);
        }

        if (delayedScrollSpy) {
            delayTimeout = setTimeout(runScrollSpy, 500);
        } else {
            runScrollSpy();
        }

        return () => {
            clearTimeout(delayTimeout);
            stopScrollSpy?.();
        };
    }, [location?.hash, headings, delayedScrollSpy]);

    return menuRef;
}
