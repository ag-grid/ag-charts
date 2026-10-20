import { getGalleryExampleFiles } from '@components/gallery/utils/pageData';
import { getIsDev } from '@utils/env';
import { fileNameToMimeType } from '@utils/mimeType';
import { getContentRootFileUrl } from '@utils/pages';
import { shareInFlight } from '@utils/shareInFlight';
import { type CollectionEntry, getEntry } from 'astro:content';

import { getGeneratedContents } from '../../../../components/example-generator';

interface Params {
    exampleName: string;
    fileName: string;
}

// See the docs example file route: share the run in flight between concurrent dev requests.
const loadExampleFiles = shareInFlight(async () => {
    const galleryDataEntry = (await getEntry('gallery', 'data')) as CollectionEntry<'gallery'>;
    return getGalleryExampleFiles({ galleryData: galleryDataEntry?.data });
});

export async function getStaticPaths() {
    return loadExampleFiles();
}

export async function GET({ params }: { params: Params }) {
    const { exampleName, fileName } = params;

    const contentRoot = getContentRootFileUrl();
    const createErrorBody = ({ availableFiles }: any) => {
        const error = getIsDev()
            ? {
                  error: 'File not found',
                  contentPath: contentRoot.pathname,
                  availableFiles: Object.keys(availableFiles),
              }
            : {
                  error: 'File not found',
              };

        return JSON.stringify(error);
    };

    const { files = {} } =
        (await getGeneratedContents({
            type: 'gallery',
            exampleName,
        })) ?? {};
    const file = files[fileName];
    const body = file ?? createErrorBody({ availableFiles: files });

    return new Response(body, {
        headers: {
            'Content-Type': fileNameToMimeType(fileName),
        },
    });
}
