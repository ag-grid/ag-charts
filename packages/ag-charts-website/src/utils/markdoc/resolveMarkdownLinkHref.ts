import type { Framework } from '@ag-grid-types';
import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { urlWithPrefix } from '@utils/urlWithPrefix';

/**
 * Rewrite a link href from a docs page's Markdoc source for that page's `.md` twin.
 *
 * A twin is read detached from the site — no base URL, no current page — so every link resolves
 * to an absolute URL, same-page anchors included. Kept out of `renderMarkdocResolvers`, which
 * pulls in the example generator and the content collections, so this stays unit-testable.
 */
export function resolveMarkdownLinkHref({
    href,
    framework,
    pageName,
    siteRoot,
}: {
    href: string;
    framework: Framework;
    pageName: string;
    /** Canonical origin. Without one the links stay site-relative. */
    siteRoot?: string;
}): string {
    try {
        if (href.startsWith('#')) {
            return toAbsoluteUrl(urlWithPrefix({ url: `./${pageName}/`, framework }), siteRoot) + href;
        }
        return toAbsoluteUrl(urlWithPrefix({ url: href, framework }), siteRoot);
    } catch {
        // urlWithPrefix rejects forms it cannot classify; the author's href beats a mangled one.
        return href;
    }
}
