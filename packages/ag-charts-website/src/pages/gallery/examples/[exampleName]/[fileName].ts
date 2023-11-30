import { getGalleryExampleFiles } from '@features/gallery/utils/pageData';
import { getIsDev } from '@utils/env';
import { getContentRootFileUrl } from '@utils/pages';
import { getEntry } from 'astro:content';

import { getGeneratedContents } from '../../../../features/example-generator';

interface Params {
    exampleName: string;
    fileName: string;
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const exampleFiles = await getGalleryExampleFiles({
        galleryData: galleryDataEntry?.data,
    });
    return exampleFiles;
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
        })) || {};
    const file = files && files[fileName];
    const body = file ? file : createErrorBody({ availableFiles: files });

    return new Response(body);
}
