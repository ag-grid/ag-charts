import { buildCommunityToolsExtensionsMarkdown } from '@ag-website-shared/markdown-pages/community/buildCommunityToolsExtensionsMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';

// Served at /community/tools-extensions.md — a markdown twin of the /community/tools-extensions
// page for LLMs, built from the same tools-extensions.json the page renders.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    return new Response(
        buildCommunityToolsExtensionsMarkdown({ product: 'AG Charts', currentSite: 'charts', siteRoot: SITE_URL }),
        {
            status: 200,
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
            },
        }
    );
}
