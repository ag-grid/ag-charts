import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import type { APIContext } from 'astro';
import { getEntry } from 'astro:content';

import { getGeneratedContents } from '../../../../features/example-generator';

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExamplePages({ galleryData: galleryDataEntry?.data });
    return pages;
}

export async function GET(context: APIContext) {
    const { exampleName } = context.params;

    const generatedContents = await getGeneratedContents({
        type: 'gallery',
        exampleName: exampleName!,
    });

    return new Response(JSON.stringify(generatedContents), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
