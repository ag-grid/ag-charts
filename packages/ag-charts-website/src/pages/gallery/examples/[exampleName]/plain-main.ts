import { getEntry } from 'astro:content';
import { getGeneratedGalleryContents } from '@features/gallery/utils/examplesGenerator';
import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import { transformPlainEntryFile } from '@features/gallery/utils/transformPlainEntryFile';

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
        (await getGeneratedGalleryContents({
            exampleName,
        })) || {};
    const entryFile = files[entryFileName!];
    const body = transformPlainEntryFile(entryFile);

    return {
        body,
    };
}
