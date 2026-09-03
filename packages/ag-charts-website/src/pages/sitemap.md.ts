import parseSitemap from '@ag-website-shared/components/sitemap/utils/sitemaputils';
import { SITEMAP_BUILD_DIR, SITEMAP_CACHE_DIR } from '@ag-website-shared/constants';
import { getSitemapXml } from '@ag-website-shared/utils/getSitemapXml';
import { DISABLE_MARKDOWN_DOCS, LIVE_SITEMAP_URL, PRODUCTION_CHARTS_SITE_URL, SITE_URL } from '@constants';
import { buildChartsFrontmatter } from '@utils/markdown-pages/chartsFrontmatter';
import { SITEMAP_PAGE_CONTENT } from '@utils/markdown-pages/sitemapPageContent';

// Content-negotiated from the HTML URL on Accept: text/markdown — see htaccessRules.ts.
export async function GET() {
    if (DISABLE_MARKDOWN_DOCS) {
        return new Response(null, { status: 404 });
    }

    const sitemapUrl = LIVE_SITEMAP_URL ?? `${PRODUCTION_CHARTS_SITE_URL}/sitemap-0.xml`;
    const xmlSitemap = await getSitemapXml({
        cacheDir: SITEMAP_CACHE_DIR,
        sitemapUrl,
        recordDir: SITEMAP_BUILD_DIR,
    });
    const parsedSitemap = parseSitemap(xmlSitemap);

    const sections = Object.keys(parsedSitemap).map((category) => {
        const links = parsedSitemap[category].map(({ url, pageName }) => `- [${pageName}](${url})`).join('\n');
        return `## ${category}\n\n${links}`;
    });

    const output =
        [
            buildChartsFrontmatter({
                pageUrl: '/sitemap/',
                siteRoot: SITE_URL,
                title: SITEMAP_PAGE_CONTENT.title,
                description: SITEMAP_PAGE_CONTENT.description,
            }),
            `# ${SITEMAP_PAGE_CONTENT.heading}`,
            SITEMAP_PAGE_CONTENT.description,
            `Every page listed here also has a markdown version: append \`.md\` to the URL. The homepage is the one URL with no \`.md\` suffix - its copy is ${PRODUCTION_CHARTS_SITE_URL}/index.md.`,
            ...sections,
        ].join('\n\n') + '\n';

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
