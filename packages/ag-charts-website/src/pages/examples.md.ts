import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildDemoMarkdown } from '@utils/markdown-pages/buildDemoMarkdown';

// Served at /examples.md — a markdown twin of the /examples/ showcase page for LLMs. The page is
// an interactive demo with no text form, so the twin carries its hero copy and the list of
// sibling demos. Generated at build time so it cannot drift.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildDemoMarkdown({ demo: 'financial', siteRoot: SITE_URL });

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
