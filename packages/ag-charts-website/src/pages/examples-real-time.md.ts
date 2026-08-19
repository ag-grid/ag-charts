import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildDemoMarkdown } from '@utils/markdown-pages/buildDemoMarkdown';

// Served at /examples-real-time.md — see examples.md.ts for why the showcase pages ship twins.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildDemoMarkdown({ demo: 'real-time', siteRoot: SITE_URL });

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
