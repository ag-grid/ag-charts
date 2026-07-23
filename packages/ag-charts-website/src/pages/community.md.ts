import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildCommunityMarkdown } from '@utils/markdown-pages/buildCommunityMarkdown';

// Served at /community.md — a markdown twin of the /community/ page for LLMs. Generated at
// build time from the same shared community JSON the page renders, so it cannot drift.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildCommunityMarkdown({ siteRoot: SITE_URL });

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
