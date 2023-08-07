import { getEntry } from 'astro:content';
import { readFileSync, existsSync } from 'node:fs';
import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import { getThumbnail } from '@features/gallery/utils/getThumbnail';
import { getPlainThumbnailFileUrl } from '@features/gallery/utils/filesData';
import { getIsDev } from '@utils/env';

interface Params {
    exampleName: string;
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExamplePages({ galleryData: galleryDataEntry.data });
    return pages;
}

export async function get({ params }: { params: Params }) {
    const { exampleName } = params;

    const isDev = getIsDev();
    const imageFilePath = getPlainThumbnailFileUrl({ exampleName });

    // Generate the thumbnail image for dev
    let imageBuffer;
    if (isDev) {
        imageBuffer = await getThumbnail({ exampleName });
    } else {
        // Show error during production build, and let the build fail if gallery thumbnails are not generated
        if (!existsSync(imageFilePath)) {
            // eslint-disable-next-line no-console
            console.error(
                `No image found at: ${imageFilePath}.\nRun \`nx generate-gallery-thumbnails ag-charts-website\` to generate gallery images.`
            );
        }
        // Get it from cache if on production
        imageBuffer = readFileSync(imageFilePath);
    }

    return {
        body: imageBuffer,
        encoding: 'binary',
    };
}
