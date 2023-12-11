import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import type { APIContext } from 'astro';
import { getEntry } from 'astro:content';

import { getGeneratedContents } from '../../../../features/example-generator';
import { format } from '../../../../utils/format';

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExamplePages({ galleryData: galleryDataEntry?.data });
    return pages;
}

export async function get(context: APIContext) {
    const { exampleName } = context.params;

    const generatedContents = await getGeneratedContents({
        type: 'gallery',
        exampleName: exampleName!,
    });

    const files: Record<string, string> = {};
    for (const [fileName, fileText] of Object.entries(generatedContents?.files ?? {})) {
        try {
            files[fileName] = await format(fileName, fileText);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(`Unable to prettier format ${fileName} for [gallery/examples/${exampleName}]`);
            files[fileName] = fileText;
        }
    }

    return new Response(JSON.stringify({ ...generatedContents, files }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
