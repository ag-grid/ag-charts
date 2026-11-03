import { buildLicensePricingMarkdown } from '@ag-website-shared/markdown-pages/buildLicensePricingMarkdown';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import { chartsSiteFrontmatter } from '@utils/markdown-pages/chartsFrontmatter';

export function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const output = buildLicensePricingMarkdown({
        siteRoot: SITE_URL,
        siteFrontmatter: chartsSiteFrontmatter({ pageUrl: '/license-pricing/', siteRoot: SITE_URL }),
    });

    return new Response(output, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
