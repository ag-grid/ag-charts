import { type MarkdownFramework, renderMarkdocToMarkdown } from '@ag-website-shared/markdoc/renderMarkdocToMarkdown';
import { getDocsPages } from '@components/docs/utils/pageData';
import { DISABLE_MARKDOWN_DOCS, SITE_URL, agChartsVersion } from '@constants';
import { docsPageDescription } from '@utils/docsPageDescription';
import { getDocsRelatedLinks } from '@utils/docsRelatedLinks';
import { createChartsMarkdownResolvers } from '@utils/markdoc/renderMarkdocResolvers';
import { CHARTS_PRODUCT_NAME, llmsTxtUrl } from '@utils/markdown-pages/chartsFrontmatter';
import { type CollectionEntry, getCollection, getEntry } from 'astro:content';

import markdocConfig from '../../../markdoc.config';

// Endpoint routes mirror the HTML pages' framework fan-out, so the URL sets line up 1:1.
export async function getStaticPaths() {
    if (DISABLE_MARKDOWN_DOCS) {
        return [];
    }
    const pages = await getCollection('docs');
    return getDocsPages(pages);
}

export async function GET({
    props,
    params,
}: {
    props: { page: CollectionEntry<'docs'> };
    params: Record<string, string>;
}) {
    const { page } = props;
    const framework = params.framework as MarkdownFramework;
    const pageName = params.pageName;

    // Use the current environment's origin so links resolve to the site the .md is served from.
    const siteRoot = SITE_URL;
    const resolvers = createChartsMarkdownResolvers({ siteRoot });

    const { data: docsNavData } = (await getEntry('docsNav', 'nav')) as CollectionEntry<'docsNav'>;

    const markdown = await renderMarkdocToMarkdown({
        body: page.body ?? '',
        framework,
        pageName,
        frontmatter: {
            title: page.data.title,
            // The description the HTML page puts in its meta tag: the page's own frontmatter
            // where it has one, otherwise its opening paragraph. Without the SEO tagline the
            // HTML appends, which is marketing copy rather than a summary of the page.
            description: docsPageDescription({
                framework,
                pageDescription: page.data.description,
                body: page.body ?? '',
            }),
            enterprise: page.data.enterprise,
        },
        product: CHARTS_PRODUCT_NAME,
        // The page's nav neighbours, so a reader holding only this file can still navigate.
        related: getDocsRelatedLinks({
            navSections: [docsNavData.sections],
            pageName,
            framework,
            siteRoot,
            overrides: page.data.related,
        }),
        llmsTxt: llmsTxtUrl(siteRoot),
        // Release version only — drop the beta/build suffix (e.g. 12.0.0-beta.2026… → 12.0.0).
        version: agChartsVersion.split('-')[0],
        // Mirrors what the HTML page injects via <Content> props, so $migrationVersion resolves the same.
        variables: { migrationVersion: page.data.migrationVersion },
        markdocConfig,
        resolvers,
    });

    return new Response(markdown, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    });
}
