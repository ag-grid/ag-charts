import { buildCommunityMarkdown } from '@ag-website-shared/markdown-pages/community/buildCommunityMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { chartsSiteFrontmatter } from '@utils/markdown-pages/chartsFrontmatter';

// Served at /community.md — a markdown twin of the /community/ page for LLMs. Generated at
// build time from the same shared community JSON the page renders, so it cannot drift.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildCommunityMarkdown({
        product: 'AG Charts',
        currentSite: 'charts',
        siteRoot: SITE_URL,
        siteFrontmatter: chartsSiteFrontmatter({ pageUrl: '/community/', siteRoot: SITE_URL }),
    });

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
