import parseSitemap from '@ag-website-shared/components/sitemap/utils/sitemaputils';
import { SITEMAP_CACHE_DIR } from '@ag-website-shared/constants';
import { getSitemapXml } from '@ag-website-shared/utils/getSitemapXml';
import { DISABLE_MARKDOWN_DOCS, LIVE_SITEMAP_URL, PRODUCTION_CHARTS_SITE_URL } from '@constants';
import { SITEMAP_PAGE_CONTENT } from '@utils/markdown-pages/sitemapPageContent';

// Served at /sitemap.md — the markdown twin of the HTML sitemap page, built from the same parsed
// sitemap XML the page renders, so the two list the same pages under the same categories.
// Content-negotiates from the HTML URL on Accept: text/markdown (see htaccessRules.ts).
export async function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const sitemapUrl = LIVE_SITEMAP_URL ?? `${PRODUCTION_CHARTS_SITE_URL}/sitemap-0.xml`;
    const xmlSitemap = await getSitemapXml({ cacheDir: SITEMAP_CACHE_DIR, sitemapUrl });
    const parsedSitemap = parseSitemap(xmlSitemap);

    const sections = Object.keys(parsedSitemap).map((category) => {
        const links = parsedSitemap[category].map(({ url, pageName }) => `- [${pageName}](${url})`).join('\n');
        return `## ${category}\n\n${links}`;
    });

    const output =
        [
            [
                '---',
                `title: ${JSON.stringify(SITEMAP_PAGE_CONTENT.title)}`,
                `description: ${JSON.stringify(SITEMAP_PAGE_CONTENT.description)}`,
                '---',
            ].join('\n'),
            `# ${SITEMAP_PAGE_CONTENT.heading}`,
            SITEMAP_PAGE_CONTENT.description,
            `Most pages listed here also have a markdown version: append \`.md\` to the URL. The homepage is the one URL with no \`.md\` suffix - its copy is ${PRODUCTION_CHARTS_SITE_URL}/index.md. The Options and Themes API reference pages have no markdown version.`,
            ...sections,
        ].join('\n\n') + '\n';

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
