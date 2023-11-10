import { getGeneratedGalleryContents } from '@features/gallery/utils/examplesGenerator';
import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import type { APIContext } from 'astro';
import { getEntry } from 'astro:content';

import { format } from '../../../../utils/format';

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExamplePages({ galleryData: galleryDataEntry?.data });
    return pages;
}

export async function get(context: APIContext) {
    const { exampleName } = context.params;

    const generatedContents = await getGeneratedGalleryContents({
        exampleName: exampleName!,
    });

    const files: Record<string, string> = {};
    for (const [fileName, fileText] of Object.entries(generatedContents?.files ?? {})) {
        files[fileName] = await format(fileName, fileText);
    }

    return new Response(JSON.stringify({ ...generatedContents, files }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
