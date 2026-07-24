import { buildCommunityShowcaseMarkdown } from '@ag-website-shared/markdown-pages/community/buildCommunityShowcaseMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';

// Served at /community/showcase.md — a markdown twin of the /community/showcase page for LLMs,
// built from the same showcase.json the page renders.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    return new Response(
        buildCommunityShowcaseMarkdown({ product: 'AG Charts', currentSite: 'charts', siteRoot: SITE_URL }),
        {
            status: 200,
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
            },
        }
    );
}
