import { buildCommunityEventsMarkdown } from '@ag-website-shared/markdown-pages/community/buildCommunityEventsMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { chartsSiteFrontmatter } from '@utils/markdown-pages/chartsFrontmatter';

// Served at /community/events.md — a markdown twin of the /community/events page for LLMs,
// built from the same events.json the page renders.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    return new Response(
        buildCommunityEventsMarkdown({
            product: 'AG Charts',
            currentSite: 'charts',
            siteRoot: SITE_URL,
            siteFrontmatter: chartsSiteFrontmatter({ pageUrl: '/community/events/', siteRoot: SITE_URL }),
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
            },
        }
    );
}
