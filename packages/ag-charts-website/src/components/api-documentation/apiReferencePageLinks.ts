import type { ApiReferenceType } from '@components/api-documentation/apiReferenceHelpers';
import {
    OPTIONS_API_PAGE_CONTENT,
    THEMES_API_PAGE_CONTENT,
    apiReferencePageHeading,
} from '@utils/markdown-pages/apiReferencePageContent';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import { getOptionsStaticPaths, getThemesApiStaticPaths } from './apiReferenceHelpers';

/** The path segment each of the two API references generates its pages under. */
export type ReferenceBasePath = 'options' | 'themes-api';

export interface ReferencePageLink {
    /** Site-relative href, carrying the site base URL. */
    href: string;
    /** Page heading, mirroring the `<h1>` of the page it points at. */
    label: string;
}

export const REFERENCE_ROOT_LINKS: Record<ReferenceBasePath, ReferencePageLink> = {
    options: { href: urlWithBaseUrl('/options/'), label: OPTIONS_API_PAGE_CONTENT.title },
    'themes-api': { href: urlWithBaseUrl('/themes-api/'), label: THEMES_API_PAGE_CONTENT.title },
};

/**
 * Every page generated beneath a reference root — the union variants of `/options/`, or the
 * `overrides` entries of `/themes-api/`. A root page lists these on both of its surfaces, the
 * served HTML and the markdown twin, which read the set from here so they cannot disagree.
 */
export function getReferencePageLinks(reference: ApiReferenceType, basePath: ReferenceBasePath): ReferencePageLink[] {
    if (basePath === 'themes-api') {
        return getThemesApiStaticPaths(reference).map(({ params, props }) => ({
            href: urlWithBaseUrl(`/themes-api/overrides/${params.memberName}/`),
            label: apiReferencePageHeading(props.pageTitle),
        }));
    }
    return getOptionsStaticPaths(reference).map(({ params, props }) => ({
        href: urlWithBaseUrl(`/options/${params.memberName}/${params.type}/`),
        label: apiReferencePageHeading(props.pageTitle),
    }));
}
