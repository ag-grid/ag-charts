import { runNxGenerateGalleryExample } from '@ag-website-shared/utils/runNxGenerateExample';
import { getGeneratedContents, hasGeneratedContents } from '@components/example-generator';
import { hasExampleFolder } from '@components/gallery/utils/filesData';
import { getGalleryExamplePages } from '@components/gallery/utils/pageData';
import { getIsDev } from '@utils/env';
import type { APIContext } from 'astro';
import { type CollectionEntry, getEntry } from 'astro:content';

export async function getStaticPaths() {
    const galleryDataEntry = (await getEntry('gallery', 'data')) as CollectionEntry<'gallery'>;
    const pages = getGalleryExamplePages({ galleryData: galleryDataEntry?.data });
    return pages;
}

export async function GET(context: APIContext) {
    const { internalFramework, pageName, exampleName } = context.params;

    let generatedContents;
    try {
        const hasGenerated = hasGeneratedContents({
            type: 'gallery',
            exampleName: exampleName!,
        });
        const hasContents = hasExampleFolder({
            pageName: pageName!,
            exampleName: exampleName!,
        });
        if (!hasGenerated) {
            if (hasContents && getIsDev()) {
                await runNxGenerateGalleryExample({
                    pageName: pageName!,
                    exampleName: exampleName!,
                });
            } else {
                throw new Error(`Contents file not found`);
            }
        }

        generatedContents = await getGeneratedContents({
            type: 'gallery',
            exampleName: exampleName!,
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error generating contents: ${(error as Error).message}`);
        return new Response(
            JSON.stringify({ error: 'Error generating contents.json file', internalFramework, pageName, exampleName }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    return new Response(JSON.stringify(generatedContents), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
