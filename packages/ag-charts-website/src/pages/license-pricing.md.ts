import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { buildLicensePricingMarkdown } from '@utils/markdown-pages/buildLicensePricingMarkdown';

// Served at /license-pricing.md — a markdown twin of the /license-pricing/ page for
// LLMs. Generated at build time from the same plan/feature data the page renders, so
// it cannot drift.
export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildLicensePricingMarkdown({ siteRoot: SITE_URL });

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
