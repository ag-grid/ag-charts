import { type MarkdownFramework, renderMarkdocToMarkdown } from '@ag-website-shared/markdoc/renderMarkdocToMarkdown';
import { getDocsPages } from '@components/docs/utils/pageData';
import { DISABLE_MARKDOWN_DOCS, SITE_URL, agChartsVersion } from '@constants';
import { createChartsMarkdownResolvers } from '@utils/markdoc/renderMarkdocResolvers';
import { type CollectionEntry, getCollection } from 'astro:content';

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
    const resolvers = createChartsMarkdownResolvers({ siteRoot: SITE_URL });

    const markdown = await renderMarkdocToMarkdown({
        body: page.body ?? '',
        framework,
        pageName,
        frontmatter: {
            title: page.data.title,
            description: page.data.description,
            enterprise: page.data.enterprise,
        },
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
