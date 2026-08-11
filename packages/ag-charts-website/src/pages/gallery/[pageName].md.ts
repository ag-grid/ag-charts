import { getGalleryPages } from '@components/gallery/utils/pageData';
import { DISABLE_MARKDOWN_DOCS, SITE_URL } from '@constants';
import type { GalleryExampleNeighbour, GalleryExamplePage } from '@utils/markdown-pages/buildGalleryExampleMarkdown';
import { buildGalleryExampleMarkdown } from '@utils/markdown-pages/buildGalleryExampleMarkdown';
import { type CollectionEntry, getEntry } from 'astro:content';

// Served at /gallery/<example>.md — the markdown twin of each gallery example page, built from the
// same gallery entry and generated example the page renders. Mirrors the page's own getStaticPaths
// so the two URL sets line up 1:1. Content-negotiates from the HTML URL on Accept: text/markdown
// (see getMarkdownNegotiationRules in htaccessRules.ts).
export async function getStaticPaths() {
    if (DISABLE_MARKDOWN_DOCS) {
        return [];
    }
    const galleryEntry = (await getEntry('gallery', 'data')) as CollectionEntry<'gallery'>;
    return getGalleryPages({ galleryData: galleryEntry.data });
}

export async function GET({
    props,
    params,
}: {
    props: {
        page: GalleryExamplePage;
        prevExample: GalleryExampleNeighbour;
        nextExampleOne: GalleryExampleNeighbour;
        nextExampleTwo: GalleryExampleNeighbour;
    };
    params: Record<string, string>;
}) {
    const { page, prevExample, nextExampleOne, nextExampleTwo } = props;

    const output = await buildGalleryExampleMarkdown({
        page,
        exampleName: params.pageName,
        neighbours: [prevExample, nextExampleOne, nextExampleTwo],
        siteRoot: SITE_URL,
    });

    return new Response(output, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
}
