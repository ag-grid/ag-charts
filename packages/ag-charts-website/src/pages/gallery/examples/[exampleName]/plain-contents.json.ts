import { getGeneratedPlainGalleryContents } from '@features/gallery/utils/examplesGenerator';
import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import { getEntry } from 'astro:content';

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

    const generatedContents =
        (await getGeneratedPlainGalleryContents({
            exampleName,
        })) || {};
    const body = generatedContents;

    return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
