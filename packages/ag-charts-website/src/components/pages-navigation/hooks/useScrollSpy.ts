import { useLocation } from '@ag-website-shared/utils/navigation';
import type { MarkdownHeading } from 'astro';
import { useEffect, useRef } from 'react';
import { scrollspy } from 'src/utils/scrollspy';

export function useScrollSpy({ headings, offset = 120 }: { headings: MarkdownHeading[]; offset?: number }) {
    const menuRef = useRef<HTMLElement>(null);
    const location = useLocation();

    function handleScrollSpy(slug: string) {
        if (menuRef.current == null) return;
        for (const navItem of menuRef.current.querySelectorAll('a')) {
            navItem.classList.toggle('active', navItem.getAttribute('href') === `#${slug}`);
        }
    }

    useEffect(() => scrollspy(headings, handleScrollSpy, { offset }), [location?.hash, headings]);

    return menuRef;
}
