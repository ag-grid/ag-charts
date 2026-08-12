// cspell:ignore whats
import { buildWhatsNewMarkdown } from '@ag-website-shared/markdown-pages/buildWhatsNewMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import { type CollectionEntry, getEntry } from 'astro:content';

// Served at /whats-new.md — the markdown twin of the /whats-new page, built from the same versions
// collection and shared product metadata the page renders. Content-negotiates from the HTML URL on
// Accept: text/markdown (see getMarkdownNegotiationRules in htaccessRules.ts).
export async function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const { data: versionsData } = (await getEntry('versions', 'ag-charts-versions')) as CollectionEntry<'versions'>;

    const output = buildWhatsNewMarkdown({
        site: 'charts',
        versionsData,
        siteRoot: SITE_URL,
        // Highlight and release-note paths are framework-relative; the page resolves them against
        // the reader's remembered framework, so the twin picks the framework-agnostic core.
        resolveUrl: (url) => urlWithPrefix({ framework: 'javascript', url }),
    });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
