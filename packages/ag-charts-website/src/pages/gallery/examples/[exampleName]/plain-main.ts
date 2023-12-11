import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import { transformPlainEntryFile } from '@features/gallery/utils/transformPlainEntryFile';
import { getEntry } from 'astro:content';

import { getGeneratedContents } from '../../../../features/example-generator';

interface Params {
    exampleName: string;
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExamplePages({ galleryData: galleryDataEntry?.data });
    return pages;
}

export async function get({ params }: { params: Params }) {
    const { exampleName } = params;

    const { entryFileName, files = {} } =
        (await getGeneratedContents({
            type: 'gallery',
            exampleName,
            ignoreDarkMode: true,
        })) || {};
    const entryFile = files[entryFileName!];
    const { code } = transformPlainEntryFile(entryFile, files['data.js']);

    return new Response(JSON.stringify(code));
}
