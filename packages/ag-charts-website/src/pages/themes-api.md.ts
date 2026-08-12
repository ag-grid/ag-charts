import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildThemesApiMarkdown } from '@utils/markdown-pages/buildApiReferenceMarkdown';
import { getInterfacesReference } from '@utils/server/getInterfacesReference';

// Served at /themes-api.md — the markdown twin of the Themes API reference page, built from the
// same generated interface reference the page renders client-side. Content-negotiates from the
// HTML URL on Accept: text/markdown (see getMarkdownNegotiationRules in htaccessRules.ts).
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildThemesApiMarkdown({ reference: getInterfacesReference(), siteRoot: SITE_URL });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
