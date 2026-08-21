import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildHomepageMarkdown } from '@utils/markdown-pages/buildHomepageMarkdown';

export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildHomepageMarkdown({ siteRoot: SITE_URL });

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
