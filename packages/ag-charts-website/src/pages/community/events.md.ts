import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildCommunityEventsMarkdown } from '@utils/markdown-pages/buildCommunityEventsMarkdown';

// Served at /community/events.md — a markdown twin of the /community/events page for LLMs,
// built from the same events.json the page renders.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    return new Response(buildCommunityEventsMarkdown({ siteRoot: SITE_URL }), {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
