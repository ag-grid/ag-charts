// cspell:ignore whats
import { buildWhatsNewMarkdown } from '@ag-website-shared/markdown-pages/buildWhatsNewMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { chartsSiteFrontmatter } from '@utils/markdown-pages/chartsFrontmatter';
import { urlWithPrefix } from '@utils/urlWithPrefix';
import { type CollectionEntry, getEntry } from 'astro:content';

// Reached from the HTML URL via Accept: text/markdown (see getMarkdownNegotiationRules).
export async function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const { data: versionsData } = (await getEntry('versions', 'ag-charts-versions')) as CollectionEntry<'versions'>;

    const output = buildWhatsNewMarkdown({
        site: 'charts',
        versionsData,
        siteRoot: SITE_URL,
        siteFrontmatter: chartsSiteFrontmatter({ pageUrl: '/whats-new/', siteRoot: SITE_URL }),
        // Paths are framework-relative; the twin has no remembered framework, so pick the core.
        resolveUrl: (url) => urlWithPrefix({ framework: 'javascript', url }),
    });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
