import { toAbsoluteUrl } from '@ag-website-shared/markdoc/toAbsoluteUrl';
import { buildContactMarkdown } from '@ag-website-shared/markdown-pages/buildContactMarkdown';
import { DISABLE_MARKDOWN_DOCS, LIBRARY, SITE_URL } from '@constants';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

// Content-negotiated from the HTML URL on Accept: text/markdown — see getMarkdownNegotiationRules in htaccessRules.ts.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildContactMarkdown({
        library: LIBRARY,
        contactUrl: toAbsoluteUrl(urlWithBaseUrl('/contact/'), SITE_URL),
    });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
