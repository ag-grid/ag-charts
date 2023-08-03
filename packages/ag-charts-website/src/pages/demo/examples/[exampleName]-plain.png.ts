import { getEntry } from 'astro:content';
import { readFileSync, existsSync } from 'node:fs';
import { getDemoExamplePages } from '../../../features/demo/utils/pageData';
import { getThumbnail } from '../../../features/demo/utils/getThumbnail';
import { getPlainThumbnailFileUrl } from '../../../features/demo/utils/filesData';
import { getIsDev } from '../../../utils/env';

interface Params {
    exampleName: string;
}

export async function getStaticPaths() {
    const demosEntry = await getEntry('demo', 'demos');
    const pages = getDemoExamplePages({ demos: demosEntry.data });
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
        // Show error during production build, and let the build fail if demo thumbnails are not generated
        if (!existsSync(imageFilePath)) {
            // eslint-disable-next-line no-console
            console.error(
                `No image found at: ${imageFilePath}.\nRun \`nx generate-demo-thumbnails ag-charts-website\` to generated demo images.`
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
