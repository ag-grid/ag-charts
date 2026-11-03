import { useMemo } from 'react';

import { FALLBACK_NAV_DEPTH, type FallbackNavItem, buildFallbackNav } from '../apiReferenceFallbackNav';
import type { ApiReferenceType, SpecialTypesMap } from '../apiReferenceHelpers';

interface ApiReferenceNavLinksProps {
    reference: ApiReferenceType;
    rootInterface: string;
    rootLabel: string;
    basePath: string;
    pageInterface: string;
    specialTypes?: SpecialTypesMap;
    noExpand?: string[];
}

/**
 * The links of the server-rendered fallback navigation, kept in the page once the island replaces the
 * fallback. The interactive tree renders only the branches that are expanded, so without these the
 * rendered page would not link to most of the reference pages. Hidden, as the tree is how people
 * browse the section.
 */
export function ApiReferenceNavLinks({
    reference,
    rootInterface,
    rootLabel,
    basePath,
    pageInterface,
    specialTypes,
    noExpand,
}: ApiReferenceNavLinksProps) {
    const nav = useMemo(
        () =>
            buildFallbackNav({
                reference,
                rootInterface,
                rootLabel,
                basePath,
                config: { specialTypes, noExpand },
                pageInterface,
                depth: FALLBACK_NAV_DEPTH,
            }),
        [reference, rootInterface, rootLabel, basePath, pageInterface, specialTypes, noExpand]
    );

    return (
        <nav hidden>
            <NavLinkList items={[nav]} />
        </nav>
    );
}

function NavLinkList({ items }: { items: FallbackNavItem[] }) {
    return (
        <ul>
            {items.map((item) => (
                <li key={item.href}>
                    <a href={item.href} aria-current={item.isCurrentPage ? 'page' : undefined}>
                        {item.label}
                    </a>
                    {item.children.length > 0 && <NavLinkList items={item.children} />}
                </li>
            ))}
        </ul>
    );
}
